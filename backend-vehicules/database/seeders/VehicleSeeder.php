<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Création des Catégories
        $eco = Category::firstOrCreate(
            ['name' => 'Économique'],
            ['description' => 'Petites voitures de ville à faible consommation.']
        );
        $compact = Category::firstOrCreate(
            ['name' => 'Compact'],
            ['description' => 'Voitures moyennes idéales pour les trajets quotidiens.']
        );
        $suv = Category::firstOrCreate(
            ['name' => 'SUV'],
            ['description' => 'Véhicules spacieux pour la famille et les longs trajets.']
        );
        $luxe = Category::firstOrCreate(
            ['name' => 'Luxe'],
            ['description' => 'Véhicules de prestige et grand confort.']
        );

        // 2. Création de 10 Véhicules Variés
        $vehicles = [
            // Économique
            [
                'brand' => 'Toyota', 'model' => 'Yaris', 'year' => 2022,
                'license_plate' => 'TD-1001-AA', 'category_id' => $eco->id,
                'daily_rate' => 20000, 'fuel_type' => 'essence',
                'transmission' => 'manual', 'seats' => 5,
            ],
            [
                'brand' => 'Kia', 'model' => 'Picanto', 'year' => 2021,
                'license_plate' => 'TD-1002-BB', 'category_id' => $eco->id,
                'daily_rate' => 18000, 'fuel_type' => 'essence',
                'transmission' => 'manual', 'seats' => 4,
            ],

            // Compact
            [
                'brand' => 'Hyundai', 'model' => 'Elantra', 'year' => 2023,
                'license_plate' => 'TD-1003-CC', 'category_id' => $compact->id,
                'daily_rate' => 30000, 'fuel_type' => 'essence',
                'transmission' => 'automatic', 'seats' => 5,
            ],
            [
                'brand' => 'Volkswagen', 'model' => 'Golf 8', 'year' => 2022,
                'license_plate' => 'TD-1004-DD', 'category_id' => $compact->id,
                'daily_rate' => 35000, 'fuel_type' => 'diesel',
                'transmission' => 'automatic', 'seats' => 5,
            ],

            // SUV
            [
                'brand' => 'Toyota', 'model' => 'Prado', 'year' => 2023,
                'license_plate' => 'TD-1005-EE', 'category_id' => $suv->id,
                'daily_rate' => 65000, 'fuel_type' => 'diesel',
                'transmission' => 'automatic', 'seats' => 7,
            ],
            [
                'brand' => 'Ford', 'model' => 'Explorer', 'year' => 2022,
                'license_plate' => 'TD-1006-FF', 'category_id' => $suv->id,
                'daily_rate' => 55000, 'fuel_type' => 'essence',
                'transmission' => 'automatic', 'seats' => 7,
            ],
            [
                'brand' => 'Dacia', 'model' => 'Duster', 'year' => 2021,
                'license_plate' => 'TD-1007-GG', 'category_id' => $suv->id,
                'daily_rate' => 35000, 'fuel_type' => 'diesel',
                'transmission' => 'manual', 'seats' => 5,
            ],

            // Luxe
            [
                'brand' => 'Mercedes', 'model' => 'Classe S', 'year' => 2024,
                'license_plate' => 'TD-1008-HH', 'category_id' => $luxe->id,
                'daily_rate' => 120000, 'fuel_type' => 'essence',
                'transmission' => 'automatic', 'seats' => 5,
            ],
            [
                'brand' => 'Range Rover', 'model' => 'Vogue', 'year' => 2023,
                'license_plate' => 'TD-1009-II', 'category_id' => $luxe->id,
                'daily_rate' => 150000, 'fuel_type' => 'diesel',
                'transmission' => 'automatic', 'seats' => 5,
            ],
            [
                'brand' => 'Tesla', 'model' => 'Model X', 'year' => 2023,
                'license_plate' => 'TD-1010-JJ', 'category_id' => $luxe->id,
                'daily_rate' => 100000, 'fuel_type' => 'electric',
                'transmission' => 'automatic', 'seats' => 6,
            ],
        ];

        $images = [
            'vehicles/toyota_yaris.jpg',
            'vehicles/kia_picanto.jpg',
            'vehicles/hyundai_elantra.jpg',
            'vehicles/volkswagen_golf8.jpg',
            'vehicles/toyota_prado.jpg',
            'vehicles/ford_explorer.jpg',
            'vehicles/dacia_duster.jpg',
            'vehicles/mercedes_classe_s.jpg',
            'vehicles/range_rover_vogue.jpg',
            'vehicles/tesla_model_x.jpg',
        ];

        foreach ($vehicles as $index => $vehicle) {
            Vehicle::firstOrCreate(
                ['license_plate' => $vehicle['license_plate']],
                array_merge($vehicle, [
                    'status' => 'available',
                    'mileage' => rand(5000, 50000),
                    'image' => $images[$index % count($images)],
                ])
            );
        }
    }
}