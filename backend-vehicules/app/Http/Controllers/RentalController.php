<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Rental;
use App\Models\Vehicle;
use App\Models\Insurance;
use App\Enums\RentalStatus;
use App\Enums\VehicleStatus;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\VehicleService;
use App\Http\Requests\RentalRequest;
use Illuminate\Support\Facades\DB;

class RentalController extends Controller
{
    protected VehicleService $vehicleService;

    public function __construct(VehicleService $vehicleService)
    {
        $this->vehicleService = $vehicleService;
    }

    /**
     * Liste toutes les locations (Admin - protégé par route middleware)
     */
    public function index()
    {
        $rentals = Rental::with(['vehicle', 'user', 'insurance'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true, 
            'count' => $rentals->count(), 
            'data' => $rentals
        ]);
    }

    /**
     * Vérifier la disponibilité et obtenir un devis de tarification (Public)
     */
    public function getAvailability(Request $request)
    {
        $request->validate([
            'vehicle_id'   => 'required|exists:vehicles,id',
            'start_date'   => 'required|date|after_or_equal:today',
            'end_date'     => 'required|date|after:start_date',
            'insurance_id' => 'nullable|exists:insurances,id'
        ]);

        $res = $this->vehicleService->checkAvailability(
            $request->vehicle_id, 
            $request->start_date, 
            $request->end_date, 
            $request->insurance_id
        );

        if (!$res['available']) {
            return response()->json([
                'success' => false,
                'data' => [
                    'available' => false,
                    'message' => $res['reason']
                ]
            ], 200);
        }

        $vehicle = $res['vehicle'];

        return response()->json([
            'success' => true,
            'data' => [
                'available' => true,
                'vehicle' => [
                    'id' => $vehicle->id,
                    'brand' => $vehicle->brand,
                    'model' => $vehicle->model,
                    'daily_rate' => $vehicle->daily_rate,
                ],
                'calculation' => [
                    'total_days'      => $res['total_days'],
                    'daily_rate'      => $res['daily_rate'],
                    'subtotal'        => $res['subtotal'],
                    'insurance_name'  => $res['insurance_name'],
                    'insurance_daily' => $res['insurance_rate'],
                    'insurance_total' => $res['insurance_total'],
                    'total_amount'    => $res['total_amount']
                ]
            ]
        ], 200);
    }

    /**
     * Supprimer une location (Admin)
     */
    public function destroy($id)
    {
        $rental = Rental::findOrFail($id);
        $rental->delete();

        return response()->json([
            'success' => true,
            'message' => 'Location supprimée avec succès'
        ]);
    }

    /**
     * Enregistrer une réservation (Client ou Admin) - Transaction ACID
     */
    public function store(RentalRequest $request)
    {
        $availability = $this->vehicleService->checkAvailability(
            $request->vehicle_id, 
            $request->start_date, 
            $request->end_date,
            $request->insurance_id
        );

        if (!$availability['available']) {
            return response()->json([
                'success' => false,
                'message' => $availability['reason']
            ], 422);
        }

        $rental = DB::transaction(function () use ($request, $availability) {
            return Rental::create(array_merge($request->validated(), [
                'user_id'         => auth('api')->user()->id,
                'status'          => RentalStatus::PENDING->value,
                'total_days'      => $availability['total_days'],
                'daily_rate'      => $availability['daily_rate'],
                'subtotal'        => $availability['subtotal'],
                'insurance_rate'  => $availability['insurance_rate'],
                'insurance_total' => $availability['insurance_total'],
                'total_amount'    => $availability['total_amount'],
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'Réservation réussie', 
            'rental' => $rental->load(['vehicle', 'insurance'])
        ], 201);
    }

    /**
     * Voir ses propres locations (Espace Client)
     */
    public function myRentals(Request $request)
    {
        $query = Rental::where('user_id', auth('api')->user()->id)
            ->with(['vehicle', 'insurance']); 

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('year')) {
            $query->whereYear('start_date', $request->year);
        }
        
        $rentals = $query->orderByDesc('created_at')->paginate(10);
        
        return response()->json([
            'success' => true,
            'data' => $rentals,
            'summary' => [
                'total_rentals' => $rentals->total(),
                'total_spent' => Rental::where('user_id', auth('api')->user()->id)
                    ->where('status', RentalStatus::COMPLETED->value)
                    ->sum('total_amount')
            ]
        ]);
    }

    /**
     * Détails d'une location spécifique (Client propriétaire ou Admin)
     */
    public function show($id)
    {
        $rental = Rental::with(['vehicle', 'user', 'insurance'])->find($id);

        if (!$rental) {
            return response()->json(['success' => false, 'message' => 'Location non trouvée'], 404);
        }

        $user = auth('api')->user();
        if ($user->role !== 'admin' && $rental->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Action non autorisée'], 403);
        }

        return response()->json(['success' => true, 'data' => $rental]);
    }

    /**
     * Mettre à jour le statut (Admin) - Transaction ACID
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,active,completed,cancelled'
        ]);
        
        $rental = Rental::with('vehicle')->findOrFail($id);
        $newStatus = $request->status;

        DB::transaction(function () use ($rental, $newStatus) {
            if ($newStatus === RentalStatus::ACTIVE->value) {
                $rental->vehicle->update(['status' => VehicleStatus::RENTED->value]);
            } elseif (in_array($newStatus, [RentalStatus::COMPLETED->value, RentalStatus::CANCELLED->value])) {
                $rental->vehicle->update(['status' => VehicleStatus::AVAILABLE->value]);
            }

            $rental->update(['status' => $newStatus]);
        });

        return response()->json([
            'success' => true,
            'message' => "Statut mis à jour vers {$newStatus}",
            'data' => $rental->fresh(['vehicle'])
        ], 200);
    }

    /**
     * Mettre à jour une location (Admin)
     */
    public function update(Request $request, $id)
    {
        $rental = Rental::findOrFail($id);

        $request->validate([
            'vehicle_id'      => 'sometimes|exists:vehicles,id',
            'insurance_id'    => 'sometimes|nullable|exists:insurances,id',
            'start_date'      => 'sometimes|date',
            'end_date'        => 'sometimes|date|after:start_date',
            'pickup_location' => 'sometimes|string',
            'return_location' => 'sometimes|string',
            'notes'           => 'sometimes|nullable|string',
        ]);

        $vehicleId   = $request->vehicle_id ?? $rental->vehicle_id;
        $startDate   = $request->start_date ?? $rental->start_date;
        $endDate     = $request->end_date   ?? $rental->end_date;
        $insuranceId = $request->has('insurance_id') ? $request->insurance_id : $rental->insurance_id;

        if ($request->has('vehicle_id') || $request->has('start_date') || $request->has('end_date')) {
            $check = $this->vehicleService->checkAvailability(
                $vehicleId, 
                $startDate, 
                $endDate, 
                $insuranceId,
                $rental->id
            );

            if (!$check['available']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Indisponible : ' . $check['reason']
                ], 422);
            }

            $request->merge([
                'daily_rate'      => $check['daily_rate'],
                'insurance_rate'  => $check['insurance_rate'],
                'total_days'      => $check['total_days'],
                'subtotal'        => $check['subtotal'],
                'insurance_total' => $check['insurance_total'],
                'total_amount'    => $check['total_amount'],
            ]);
        }

        $rental->update($request->only([
            'vehicle_id',
            'insurance_id',
            'start_date',
            'end_date',
            'pickup_location',
            'return_location',
            'notes',
            'daily_rate',
            'insurance_rate',
            'total_days',
            'subtotal',
            'insurance_total',
            'total_amount',
        ]));

        return response()->json([
            'success' => true, 
            'message' => 'Location mise à jour avec succès', 
            'data' => $rental->load(['vehicle', 'insurance'])
        ]);
    }

    /**
     * Générer Facture PDF (Client propriétaire ou Admin)
     */
    public function generateInvoice(Request $request, $id)
    {
        $rental = Rental::with(['vehicle.category', 'user', 'insurance', 'payment'])->findOrFail($id);
        if ($request->user()->role !== 'admin' && $rental->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $logoPath = public_path('toumai-drive-logo.jpg');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        $pdf = Pdf::loadView('invoices.rental', [
            'rental' => $rental, 
            'date'   => now()->format('d/m/Y'),
            'logo'   => $logoBase64,
        ]);
        return $pdf->download("facture-{$rental->id}.pdf");
    }

    /**
     * Rapport financier détaillé (Admin)
     */
    public function getRevenueReport()
    {
        // 1. Chiffres clés 
        $stats = Rental::whereIn('status', [
            RentalStatus::CONFIRMED->value, 
            RentalStatus::ACTIVE->value, 
            RentalStatus::COMPLETED->value
        ])
        ->selectRaw('
            SUM(total_amount) as total_revenue,
            SUM(subtotal) as total_rental_only,
            SUM(insurance_total) as total_insurance_revenue,
            AVG(total_amount) as average_order_value,
            SUM(total_days) as total_days_rented
        ')
        ->first();

        // 2. Revenus mensuels pour l'année en cours
        $yearRentals = Rental::whereIn('status', [
            RentalStatus::CONFIRMED->value, 
            RentalStatus::ACTIVE->value, 
            RentalStatus::COMPLETED->value
        ])
        ->whereYear('start_date', Carbon::now()->year)
        ->get();

        $monthlyRevenue = $yearRentals->groupBy(function ($val) {
            return Carbon::parse($val->start_date)->format('m');
        })->map(function ($row, $month) {
            return [
                'month' => (int) $month,
                'total' => $row->sum('total_amount'),
            ];
        })->sortBy('month')->values();

        // 3. Revenus par véhicule
        $topVehicles = Rental::whereIn('rentals.status', [
            RentalStatus::CONFIRMED->value, 
            RentalStatus::ACTIVE->value, 
            RentalStatus::COMPLETED->value
        ])
        ->join('vehicles', 'rentals.vehicle_id', '=', 'vehicles.id')
        ->selectRaw('vehicles.brand, vehicles.model, SUM(rentals.total_amount) as revenue')
        ->groupBy('vehicles.id', 'vehicles.brand', 'vehicles.model')
        ->orderByDesc('revenue')
        ->limit(5)
        ->get();

        // 4. Analyse des statuts
        $statusAnalysis = Rental::selectRaw('status, count(*) as count, SUM(total_amount) as value')
            ->groupBy('status')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => $stats,
                'monthly_chart' => $monthlyRevenue,
                'top_performing_vehicles' => $topVehicles,
                'status_breakdown' => $statusAnalysis,
                'currency' => 'FCFA'
            ]
        ]);
    }

    /**
     * Annuler une location (Client ou Admin) - Transaction ACID
     */
    public function cancel($id)
    {
        $user = auth('api')->user();
        $rental = Rental::with('vehicle')->findOrFail($id);

        if ($user->role !== 'admin' && $rental->user_id !== $user->id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        if (in_array($rental->status, [RentalStatus::COMPLETED->value, RentalStatus::CANCELLED->value])) {
            return response()->json(['message' => 'Cette réservation ne peut plus être modifiée'], 422);
        }

        DB::transaction(function () use ($rental) {
            $rental->update(['status' => RentalStatus::CANCELLED->value]);
            $rental->vehicle->update(['status' => VehicleStatus::AVAILABLE->value]);
        });

        return response()->json([
            'success' => true,
            'message' => 'La réservation a été annulée et le véhicule est à nouveau disponible.',
            'data'    => $rental->fresh('vehicle')
        ]);
    }

    /**
     * Liste des assurances disponibles (Public)
     */
    public function getInsurances()
    {
        return response()->json([
            'success' => true,
            'data' => Insurance::all()
        ]);
    }
}