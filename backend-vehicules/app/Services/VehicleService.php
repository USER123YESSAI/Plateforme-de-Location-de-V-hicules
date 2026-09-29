<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\Rental;
use App\Models\Insurance;
use App\Enums\RentalStatus;
use App\Enums\VehicleStatus;
use Carbon\Carbon;

class VehicleService
{
    /**
     * Vérifie la disponibilité et calcule le devis complet.
     */
    public function checkAvailability($vehicleId, $startDate, $endDate, $insuranceId = null, $excludeRentalId = null)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);

        // 1. Vérifier le statut de base du véhicule
        $currentStatus = $vehicle->status instanceof VehicleStatus
            ? $vehicle->status->value
            : (string) $vehicle->status;
        if ($currentStatus !== VehicleStatus::AVAILABLE->value) {
            return [
                'available' => false, 
                'reason' => 'Le véhicule est actuellement ' . $currentStatus,
                'vehicle' => $vehicle
            ];
        }

        // 2. Vérifier les chevauchements de dates 
        $query = Rental::where('vehicle_id', $vehicleId)
            ->whereNotIn('status', [RentalStatus::CANCELLED->value, RentalStatus::COMPLETED->value])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->where('start_date', '<=', $endDate)
                  ->where('end_date', '>=', $startDate);
            });

        if ($excludeRentalId) {
            $query->where('id', '!=', $excludeRentalId);
        }

        $conflictingRental = $query->exists();

        if ($conflictingRental) {
            return [
                'available' => false, 
                'reason' => 'Ce véhicule est déjà réservé sur cette période.',
                'vehicle' => $vehicle
            ];
        }

        // 3. Calcul des tarifs si disponible
        return array_merge([
            'available' => true,
            'reason' => null,
            'vehicle' => $vehicle
        ], $this->calculatePricing($vehicle, $startDate, $endDate, $insuranceId));
    }

    /**
     * Calcule le nombre de jours et les montants financiers.
     */
    public function calculatePricing($vehicle, $startDate, $endDate, $insuranceId = null)
    {
        if (is_numeric($vehicle)) {
            $vehicle = Vehicle::findOrFail($vehicle);
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        $totalDays = max(1, $start->diffInDays($end) + 1);
        $dailyRate = (float) $vehicle->daily_rate;
        $insuranceRate = 0;
        $insurance = null;

        if ($insuranceId) {
            $insurance = Insurance::find($insuranceId);
            $insuranceRate = $insurance ? (float) $insurance->daily_rate : 0;
        }

        $subtotal = $totalDays * $dailyRate;
        $insuranceTotal = $totalDays * $insuranceRate;

        return [
            'total_days'      => (int) $totalDays,
            'daily_rate'      => $dailyRate,
            'insurance_rate'  => $insuranceRate,
            'insurance_name'  => $insurance ? $insurance->name : null,
            'subtotal'        => $subtotal,
            'insurance_total' => $insuranceTotal,
            'total_amount'    => $subtotal + $insuranceTotal,
        ];
    }
}
