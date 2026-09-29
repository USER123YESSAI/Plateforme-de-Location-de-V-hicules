<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use App\Enums\PaymentMethod;
use App\Enums\RentalStatus;
use App\Enums\VehicleStatus;
use App\Services\ChariowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Liste des paiements (Admin)
     */
    public function index()
    {
        $payments = Payment::with(['rental.user', 'rental.vehicle'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $payments,
        ]);
    }

    /**
     * Détail d'un paiement (Client propriétaire ou Admin)
     */
    public function show($id)
    {
        $payment = Payment::with(['rental.user', 'rental.vehicle'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => "Le paiement avec l'ID $id n'existe pas.",
            ], 404);
        }

        $user = auth('api')->user();
        if ($user->role !== 'admin' && $payment->rental->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $payment,
        ]);
    }

    /**
     * Effectuer un paiement direct (Client ou Admin) - Transaction ACID
     */
    public function pay(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|in:card,cash,mobile_money,bank_transfer,chariow',
            'transaction_id' => 'nullable|string|unique:payments,transaction_id',
        ]);

        $rental = Rental::with('vehicle')->findOrFail($id);
        $user = auth('api')->user();

        if ($user->role !== 'admin' && $rental->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée',
            ], 403);
        }

        if ($rental->status !== RentalStatus::PENDING->value) {
            return response()->json([
                'success' => false,
                'message' => "Paiement impossible (statut actuel : {$rental->status})",
            ], 422);
        }

        $transactionId = $request->transaction_id ?: 'TX-' . strtoupper(Str::random(10)) . '-' . time();

        $payment = DB::transaction(function () use ($rental, $request, $transactionId) {
            $paymentRecord = Payment::create([
                'rental_id'      => $rental->id,
                'amount'         => $rental->total_amount,
                'payment_method' => $request->payment_method,
                'transaction_id' => $transactionId,
                'status'         => PaymentStatus::COMPLETED->value,
                'paid_at'        => now(),
            ]);

            $rental->update(['status' => RentalStatus::CONFIRMED->value]);

            return $paymentRecord;
        });

        return response()->json([
            'success' => true,
            'message' => 'Paiement effectué avec succès',
            'data'    => $payment->load('rental'),
        ], 201);
    }

    /**
     * Initie une session de paiement Chariow en ligne (Mobile Money & Carte)
     */
    public function initiateChariowCheckout(Request $request, $id, ChariowService $chariowService)
    {
        $rental = Rental::with(['vehicle', 'user'])->findOrFail($id);
        $user = auth('api')->user();

        if ($user->role !== 'admin' && $rental->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée',
            ], 403);
        }

        if ($rental->status !== RentalStatus::PENDING->value) {
            return response()->json([
                'success' => false,
                'message' => "Cette réservation n'est plus en attente de paiement (statut : {$rental->status}).",
            ], 422);
        }

        $transactionId = 'CHW-' . $rental->id . '-' . strtoupper(Str::random(6)) . '-' . time();
        $session = $chariowService->createCheckoutSession($rental, $user, $transactionId);

        if (!$session['success']) {
            return response()->json([
                'success' => false,
                'message' => $session['message'] ?? 'Échec lors de la création de la session Chariow',
            ], 400);
        }

        // Créer ou mettre à jour la ligne de paiement en attente
        Payment::updateOrCreate(
            ['rental_id' => $rental->id],
            [
                'amount'               => $rental->total_amount,
                'payment_method'       => 'chariow',
                'transaction_id'       => $transactionId,
                'chariow_checkout_url' => $session['checkout_url'],
                'status'               => PaymentStatus::PENDING->value,
            ]
        );

        return response()->json([
            'success'      => true,
            'checkout_url' => $session['checkout_url'],
            'step'         => $session['step'] ?? 'payment',
            'simulated'    => $session['simulated'] ?? false,
            'notice'       => $session['notice'] ?? null,
            'transaction_id' => $transactionId,
        ]);
    }

    /**
     * Webhook Chariow (Pulse) pour la confirmation automatique des ventes
     */
    public function handleChariowWebhook(Request $request, ChariowService $chariowService)
    {
        $rawContent = $request->getContent();
        $signature = $request->header('x-chariow-signature') ?: $request->header('X-Chariow-Signature');

        if (config('services.chariow.webhook_secret')) {
            if (!$chariowService->verifyWebhookSignature($rawContent, $signature)) {
                Log::warning('Webhook Chariow: Signature non valide rejetée', [
                    'ip' => $request->ip(),
                ]);
                return response()->json(['error' => 'Signature invalide'], 401);
            }
        }

        $payload = $request->all();
        $event = $payload['event'] ?? ($payload['type'] ?? 'sale.completed');

        Log::info("Webhook Chariow reçu : {$event}", ['payload' => $payload]);

        if (in_array($event, ['sale.completed', 'payment.success', 'order.completed'])) {
            $result = $chariowService->handleSaleCompleted($payload['data'] ?? $payload);
            return response()->json($result);
        }

        return response()->json([
            'success' => true,
            'message' => "Événement '{$event}' ignoré",
        ]);
    }

    /**
     * Rembourser un paiement (Admin) - Transaction ACID
     */
    public function refund($id)
    {
        $payment = Payment::with('rental.vehicle')->findOrFail($id);

        if ($payment->status !== PaymentStatus::COMPLETED->value) {
            return response()->json([
                'success' => false,
                'message' => 'Seul un paiement complété peut être remboursé',
            ], 422);
        }

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => PaymentStatus::REFUNDED->value]);

            if ($payment->rental) {
                $payment->rental->update(['status' => RentalStatus::CANCELLED->value]);

                if ($payment->rental->vehicle) {
                    $payment->rental->vehicle->update(['status' => VehicleStatus::AVAILABLE->value]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Paiement remboursé, location annulée et véhicule libéré',
        ]);
    }

    /**
     * Mettre à jour le statut d'un paiement (Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:completed,pending,failed,refunded',
        ]);

        $payment->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Statut du paiement mis à jour avec succès',
            'data'    => $payment,
        ]);
    }
}