<?php

namespace Database\Seeders;

use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class RentalSeeder extends Seeder
{
    public function run(): void
    {
        $user = $this->getOrCreateClient();
        $rentals = $this->getRentalData($user->id);

        foreach ($rentals as $rental) {
            if (Vehicle::where('id', $rental['vehicle_id'])->exists()) {
                Rental::create($rental);
            }
        }
    }

    /**
     * Récupère un utilisateur client existant ou en crée un de test.
     */
    private function getOrCreateClient(): User
    {
        $user = User::where('role', 'client')->first() ?: User::first();

        if (!$user) {
            $user = User::create([
                'name' => 'Client Test',
                'email' => 'client@test.com',
                'password' => bcrypt('password'),
                'role' => 'client',
            ]);
        }

        return $user;
    }

    /**
     * Retourne les données de seed des locations.
     */
    private function getRentalData(int $userId): array
    {
        return [
            [
                "user_id" => $userId,
                "vehicle_id" => 1,
                "start_date" => "2025-02-01",
                "end_date" => "2025-02-05",
                "pickup_location" => "Aéroport Hassan Djamous (NDJ)",
                "return_location" => "Aéroport Hassan Djamous (NDJ)",
                "daily_rate" => 20000,
                "total_days" => 4,
                "subtotal" => 80000,
                "total_amount" => 80000,
                "status" => "completed",
                "notes" => "Arrivée prévue à 14h",
            ],
            [
                "user_id" => $userId,
                "vehicle_id" => 8,
                "start_date" => "2025-02-10",
                "end_date" => "2025-02-15",
                "pickup_location" => "N'Djamena Centre-ville",
                "return_location" => "Aéroport Hassan Djamous (NDJ)",
                "daily_rate" => 120000,
                "total_days" => 5,
                "subtotal" => 600000,
                "total_amount" => 600000,
                "status" => "confirmed",
                "notes" => "Client VIP",
            ],
            [
                "user_id" => $userId,
                "vehicle_id" => 5,
                "start_date" => "2025-03-01",
                "end_date" => "2025-03-07",
                "pickup_location" => "Moundou Centre",
                "return_location" => "Moundou Centre",
                "daily_rate" => 65000,
                "total_days" => 6,
                "subtotal" => 390000,
                "total_amount" => 390000,
                "status" => "active",
                "notes" => "Besoin d'un siège bébé",
            ],
            [
                "user_id" => $userId,
                "vehicle_id" => 10,
                "start_date" => "2025-03-10",
                "end_date" => "2025-03-12",
                "pickup_location" => "N'Djamena Sabangali",
                "return_location" => "N'Djamena Sabangali",
                "daily_rate" => 100000,
                "total_days" => 2,
                "subtotal" => 200000,
                "total_amount" => 200000,
                "status" => "pending",
                "notes" => "Recharge Tesla demandée",
            ],
        ];
    }
}