<?php

namespace App\Services;

use App\Models\Rental;
use App\Models\Payment;
use App\Models\User;
use App\Enums\PaymentStatus;
use App\Enums\RentalStatus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ChariowService
{
    protected string $apiKey;
    protected string $webhookSecret;
    protected string $productId;
    protected string $baseUrl;
    protected string $frontendUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('services.chariow.api_key', '');
        $this->webhookSecret = (string) config('services.chariow.webhook_secret', '');
        $this->productId = (string) config('services.chariow.product_id', '');
        $this->baseUrl = rtrim((string) config('services.chariow.base_url', 'https://api.chariow.com/v1'), '/');
        $this->frontendUrl = rtrim((string) config('services.chariow.frontend_url', 'http://localhost:3000'), '/');
    }

    /**
     * Vérifie si le service Chariow est correctement configuré.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->productId);
    }

    /**
     * Initie une session de paiement Chariow pour une location.
     */
    public function createCheckoutSession(Rental $rental, User $user, string $transactionId): array
    {
        if (!$this->isConfigured()) {
            return $this->handleUnconfiguredSession($rental, $transactionId);
        }

        $names = $this->splitName($user->name);
        $redirectUrl = $this->frontendUrl . '/client/my-rentals?payment=chariow_return&rental_id=' . $rental->id;

        $payload = [
            'product_id' => $this->productId,
            'email'      => $user->email,
            'first_name' => $names['first_name'],
            'last_name'  => $names['last_name'],
            'redirect_url' => $redirectUrl,
            'metadata'   => [
                'rental_id'      => (string) $rental->id,
                'user_id'        => (string) $user->id,
                'transaction_id' => $transactionId,
                'amount'         => (string) $rental->total_amount,
                'vehicle'        => $rental->vehicle ? "{$rental->vehicle->brand} {$rental->vehicle->model}" : '',
            ],
        ];

        if (!empty($user->phone)) {
            $payload['phone'] = ['number' => $user->phone];
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->timeout(15)
                ->post("{$this->baseUrl}/checkout", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $checkoutUrl = $data['checkout_url'] ?? ($data['data']['checkout_url'] ?? null);
                $step = $data['step'] ?? ($data['data']['step'] ?? 'payment');

                return [
                    'success'      => true,
                    'checkout_url' => $checkoutUrl,
                    'step'         => $step,
                    'raw'          => $data,
                ];
            }

            Log::error('Erreur API Chariow Checkout', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'rental_id' => $rental->id,
            ]);

            return [
                'success' => false,
                'message' => 'Impossible d’initialiser le paiement Chariow: ' . ($response->json('message') ?? 'Erreur distante'),
            ];
        } catch (\Throwable $e) {
            Log::error('Exception ChariowService::createCheckoutSession: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Erreur de connexion avec la passerelle Chariow: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Vérifie l'authenticité d'un webhook Chariow (Pulse) via HMAC-SHA256.
     */
    public function verifyWebhookSignature(string $rawContent, ?string $signatureHeader): bool
    {
        if (empty($this->webhookSecret) || empty($signatureHeader)) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawContent, $this->webhookSecret);

        return hash_equals($expected, (string) $signatureHeader);
    }

    /**
     * Traite un événement de vente finalisée (sale.completed) envoyé par Chariow.
     */
    public function handleSaleCompleted(array $eventData): array
    {
        $sale = $eventData['sale'] ?? $eventData;
        $metadata = $sale['metadata'] ?? ($eventData['metadata'] ?? []);
        $rentalId = $metadata['rental_id'] ?? null;
        $transactionId = $metadata['transaction_id'] ?? ($sale['id'] ?? null);
        $saleId = $sale['id'] ?? null;

        if (!$rentalId && !$transactionId) {
            Log::warning('Webhook Chariow: Impossible d’identifier la réservation', ['data' => $eventData]);
            return ['success' => false, 'message' => 'Identifiant de location absent'];
        }

        return DB::transaction(function () use ($rentalId, $transactionId, $saleId) {
            $paymentQuery = Payment::query();
            if ($transactionId) {
                $paymentQuery->where('transaction_id', $transactionId);
            }
            if ($rentalId) {
                $paymentQuery->orWhere('rental_id', $rentalId);
            }

            $payment = $paymentQuery->first();

            if (!$payment && $rentalId) {
                $rental = Rental::find($rentalId);
                if ($rental) {
                    $payment = Payment::create([
                        'rental_id'       => $rental->id,
                        'amount'          => $rental->total_amount,
                        'payment_method'  => 'chariow',
                        'transaction_id'  => $transactionId ?: ('CHW-' . time()),
                        'chariow_sale_id' => $saleId,
                        'status'          => PaymentStatus::COMPLETED->value,
                        'paid_at'         => now(),
                    ]);
                }
            } elseif ($payment) {
                $payment->update([
                    'status'          => PaymentStatus::COMPLETED->value,
                    'paid_at'         => now(),
                    'chariow_sale_id' => $saleId ?: $payment->chariow_sale_id,
                ]);
            }

            if ($payment && $payment->rental) {
                $payment->rental->update(['status' => RentalStatus::CONFIRMED->value]);
            }

            Log::info("Webhook Chariow: Paiement validé pour la location {$rentalId}", [
                'transaction_id' => $transactionId,
                'sale_id'        => $saleId,
            ]);

            return [
                'success' => true,
                'message' => 'Paiement Chariow confirmé avec succès',
                'payment' => $payment,
            ];
        });
    }

    /**
     * Mode simulation quand Chariow n'est pas encore configuré dans le .env
     */
    protected function handleUnconfiguredSession(Rental $rental, string $transactionId): array
    {
        $mockUrl = $this->frontendUrl . '/client/my-rentals?payment=chariow_return&rental_id=' . $rental->id . '&simulated=true';

        return [
            'success'      => true,
            'checkout_url' => $mockUrl,
            'step'         => 'payment',
            'simulated'    => true,
            'notice'       => 'Clés Chariow non configurées dans .env (mode démonstration local activé)',
        ];
    }

    /**
     * Découpe un nom complet en prénom et nom.
     */
    protected function splitName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName), 2);
        return [
            'first_name' => $parts[0] ?? 'Client',
            'last_name'  => $parts[1] ?? 'Toumaï',
        ];
    }
}
