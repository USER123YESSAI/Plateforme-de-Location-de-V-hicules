<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\CategoryController;

Route::get('health', function () {
    $dbStatus = 'disconnected';
    $dbError = null;
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Throwable $e) {
        $dbError = $e->getMessage();
    }

    return response()->json([
        'status' => 'ok',
        'php_version' => PHP_VERSION,
        'app_key_set' => !empty(config('app.key')),
        'database' => [
            'status' => $dbStatus,
            'driver' => config('database.default'),
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => config('database.connections.mysql.database'),
            'error' => $dbError,
        ]
    ]);
});

/*
|--------------------------------------------------------------------------
| 1. AUTHENTIFICATION
|--------------------------------------------------------------------------
*/
Route::group(['prefix' => 'auth'], function () {
    // Public
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login'])->name('login');

    // Protégé Utilisateur connecté (Client & Admin)
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('profile', [AuthController::class, 'updateProfile']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('accept-terms', [AuthController::class, 'acceptTerms']);
    });
});

/*
|--------------------------------------------------------------------------
| 2. ROUTES PUBLIQUES
|--------------------------------------------------------------------------
*/
Route::get('vehicles/available', [VehicleController::class, 'disponible']);
Route::get('vehicles', [VehicleController::class, 'index']);
Route::get('vehicles/{id}', [VehicleController::class, 'show'])->whereNumber('id');

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{id}', [CategoryController::class, 'show'])->whereNumber('id');
Route::get('insurances', [RentalController::class, 'getInsurances']);
Route::get('rentals/check-availability', [RentalController::class, 'getAvailability']);
Route::post('webhooks/chariow', [PaymentController::class, 'handleChariowWebhook']);

/*
|--------------------------------------------------------------------------
| 3. ROUTES CLIENT & AUTHENTIFIÉES (Client & Admin)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {
    // Réservations client
    Route::get('/my-rentals', [RentalController::class, 'myRentals']);
    Route::post('rentals', [RentalController::class, 'store']);
    Route::get('rentals/{id}', [RentalController::class, 'show'])->whereNumber('id');
    Route::patch('rentals/{id}/cancel', [RentalController::class, 'cancel'])->whereNumber('id');
    Route::get('rentals/{id}/invoice', [RentalController::class, 'generateInvoice'])->whereNumber('id');

    // Paiements client
    Route::post('rentals/{id}/pay', [PaymentController::class, 'pay'])->whereNumber('id');
    Route::post('rentals/{id}/chariow-checkout', [PaymentController::class, 'initiateChariowCheckout'])->whereNumber('id');
    Route::get('payments/{id}', [PaymentController::class, 'show'])->whereNumber('id');
});

/*
|--------------------------------------------------------------------------
| 4. ROUTES D'ADMINISTRATION (Protégées par auth:api ET admin)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:api', 'admin'])->group(function () {
    // Gestion de la Flotte de Véhicules
    Route::get('vehicles/stats', [VehicleController::class, 'getVehicleStats']);
    Route::post('vehicles', [VehicleController::class, 'store']);
    Route::put('vehicles/{id}', [VehicleController::class, 'update'])->whereNumber('id');
    Route::delete('vehicles/{id}', [VehicleController::class, 'destroy'])->whereNumber('id');
    Route::put('vehicles/{id}/status', [VehicleController::class, 'changeStatus'])->whereNumber('id');
    Route::get('vehicles/{id}/rentals', [VehicleController::class, 'vehicleHistory'])->whereNumber('id');

    // Gestion des Catégories
    Route::post('categories', [CategoryController::class, 'store']);

    // Gestion globale des Locations
    Route::get('rentals', [RentalController::class, 'index']);
    Route::put('rentals/{id}', [RentalController::class, 'update'])->whereNumber('id');
    Route::delete('rentals/{id}', [RentalController::class, 'destroy'])->whereNumber('id');
    Route::put('rentals/{id}/status', [RentalController::class, 'updateStatus'])->whereNumber('id');
    Route::get('rentals/revenue-report', [RentalController::class, 'getRevenueReport']);

    // Gestion des Paiements
    Route::get('payments', [PaymentController::class, 'index']);
    Route::put('payments/{id}/status', [PaymentController::class, 'updateStatus'])->whereNumber('id');
    Route::post('payments/{id}/refund', [PaymentController::class, 'refund'])->whereNumber('id');

    // Gestion des Clients
    Route::get('clients', [ClientController::class, 'index']);
    Route::get('clients/{id}', [ClientController::class, 'show'])->whereNumber('id');
    Route::put('clients/{id}', [ClientController::class, 'update'])->whereNumber('id');
    Route::delete('clients/{id}', [ClientController::class, 'destroy'])->whereNumber('id');
    Route::get('clients/{id}/rentals', [ClientController::class, 'rentals'])->whereNumber('id');

    // Rapports & Statistiques
    Route::get('reports/vehicles', [ReportController::class, 'vehicleStatistics']);
    Route::get('reports/vehicles/{id}', [ReportController::class, 'singleVehicleStats'])->whereNumber('id');
    Route::get('reports/revenue', [ReportController::class, 'revenueReport']);
});
