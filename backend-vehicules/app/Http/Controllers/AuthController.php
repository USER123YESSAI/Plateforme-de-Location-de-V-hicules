<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouveau client
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'terms_accepted' => 'required|accepted',
            'phone' => 'nullable|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'license_expiry' => 'nullable|date',
            'address' => 'nullable|string',
        ], [
            'terms_accepted.required' => 'Vous devez accepter les Conditions d’utilisation '
                . 'et la Politique de confidentialité.',
            'terms_accepted.accepted' => 'Vous devez accepter les Conditions d’utilisation '
                . 'et la Politique de confidentialité.',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'client',
            'phone' => $request->phone,
            'license_number' => $request->license_number,
            'license_expiry' => $request->license_expiry,
            'address' => $request->address,
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'terms_version' => (string) config('terms.version', '1.0'),
        ]);

        // Utilisation de la facade Tymon avec gestion d'erreur robuste
        try {
            $token = JWTAuth::fromUser($user);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("JWT Token generation error: " . $e->getMessage());
            return response()->json([
                'message' => 'Utilisateur créé mais erreur lors de la génération du token.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    /**
     * Connexion et génération du Token
     */
   public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $credentials = $request->only('email', 'password');

    try {
        // 2. Tentative de connexion via le guard JWT
        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Identifiants incorrects'], 401);
        }
    } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
        return response()->json(['error' => 'Impossible de créer le token'], 500);
    }

    return $this->respondWithToken($token);
}

protected function respondWithToken($token)
{
    return response()->json([
        'access_token' => $token,
        'token_type' => 'bearer',
        'expires_in' => auth('api')->factory()->getTTL() * 60,
        'user' => auth('api')->user()
    ]);
}

    /**
     * Voir le profil 
     */
    public function profile()
{
    try {
        $user = auth('api')->user();
        if (! $user) {
            return response()->json(['error' => 'Token vide ou invalide'], 404);
        }
    } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
        return response()->json(['error' => 'Token expiré'], 401);
    } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
        return response()->json(['error' => 'Token invalide'], 401);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Erreur: ' . $e->getMessage()], 500);
    }

    return response()->json($user);
}
    /**
     * Mettre à jour son propre profil
     */
   public function updateProfile(Request $request)
{
    $user = auth('api')->user();

    if (!$user) {
        return response()->json(['message' => 'Non authentifié'], 401);
    }

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        'password' => 'nullable|string|min:6|confirmed', // nullable car on ne change pas le mdp à chaque fois
        'phone' => 'nullable|string|max:20',
        'license_number' => 'nullable|string|max:50',
        'license_expiry' => 'nullable|date',
        'address' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    $data = $request->only(['name', 'email', 'phone', 'license_number', 'license_expiry', 'address']);

    if ($request->filled('password')) {
        $data['password'] = Hash::make($request->password);
    }

    // MISE À JOUR EFFECTIVE

    $user->update($data);

    return response()->json([
        'message' => 'Profil mis à jour avec succès',
        'user' => $user->fresh() 
    ]);
}

    /**
     * Déconnexion
     */
    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /**
     * Accepter la dernière version des Conditions d’utilisation et Politique de confidentialité
     */
    public function acceptTerms(Request $request)
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $validator = Validator::make($request->all(), [
            'terms_accepted' => 'required|accepted',
        ], [
            'terms_accepted.required' => 'Vous devez accepter les Conditions d’utilisation '
                . 'et la Politique de confidentialité.',
            'terms_accepted.accepted' => 'Vous devez accepter les Conditions d’utilisation '
                . 'et la Politique de confidentialité.',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $currentVersion = (string) config('terms.version', '1.0');

        $user->update([
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'terms_version' => $currentVersion,
        ]);

        return response()->json([
            'message' => 'Conditions d’utilisation acceptées avec succès',
            'user' => $user->fresh(),
            'terms_version' => $currentVersion,
        ]);
    }
}