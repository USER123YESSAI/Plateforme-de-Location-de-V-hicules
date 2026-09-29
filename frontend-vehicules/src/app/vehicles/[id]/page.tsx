"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Vehicle } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VehicleImage } from "@/components/ui/vehicle-image";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";
import { VehicleJsonLd } from "@/components/seo/VehicleJsonLd";
import {
  Calendar,
  MapPin,
  Shield,
  Clock,
  Car,
  Fuel,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";

type Insurance = {
  id: number;
  name: string;
  description: string;
  coverage: string;
  daily_rate: number;
};

type Quote = {
  total_days: number;
  daily_rate: number;
  subtotal: number;
  insurance_name: string | null;
  insurance_daily: number;
  insurance_total: number;
  total_amount: number;
};

const AGENCIES = [
  "Aéroport Hassan Djamous (NDJ)",
  "N'Djamena Centre-ville - Av. Charles de Gaulle",
  "N'Djamena Sabangali",
  "Moundou Centre",
];

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  // Form fields
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [pickupLocation, setPickupLocation] = useState(AGENCIES[0]);
  const [returnLocation, setReturnLocation] = useState(AGENCIES[0]);
  const [insuranceId, setInsuranceId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Availability & Quote
  const [quote, setQuote] = useState<Quote | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleRes = await api.get(`/vehicles/${params.id}`);
        setVehicle(vehicleRes.data.data || vehicleRes.data);

        const insRes = await api.get("/insurances");
        setInsurances(insRes.data.data || insRes.data || []);
      } catch (error) {
        console.error("[Location Express] Failed to fetch vehicle details/insurances:", error);
        toast.error("Impossible de charger les détails du véhicule");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  // Run availability check and pricing quote whenever dates or insurance changes
  useEffect(() => {
    if (!vehicle || !startDate || !endDate) return;

    const checkAvailabilityAndQuote = async () => {
      setChecking(true);
      setQuote(null);
      setAvailabilityMessage(null);
      setIsAvailable(null);

      try {
        const res = await api.get("/rentals/check-availability", {
          params: {
            vehicle_id: vehicle.id,
            start_date: startDate,
            end_date: endDate,
            insurance_id: insuranceId || undefined,
          },
        });

        if (res.data.success) {
          setIsAvailable(true);
          setQuote(res.data.data.calculation);
        } else {
          setIsAvailable(false);
          setAvailabilityMessage(res.data.data.message || "Véhicule indisponible pour ces dates.");
        }
      } catch (error: any) {
        setIsAvailable(false);
        setAvailabilityMessage(error.response?.data?.message || "Erreur lors de la vérification de disponibilité.");
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkAvailabilityAndQuote, 400);
    return () => clearTimeout(timer);
  }, [vehicle, startDate, endDate, insuranceId]);

  const handleBooking = async () => {
    if (!user) {
      router.push(`/login?redirect=/vehicles/${params.id}`);
      return;
    }
    if (user.role === "admin") {
      toast.error("Les administrateurs ne peuvent pas effectuer de réservations.");
      return;
    }
    if (!isAvailable) {
      toast.error("Le véhicule n'est pas disponible pour les dates choisies.");
      return;
    }

    setBooking(true);
    try {
      await api.post("/rentals", {
        vehicle_id: vehicle?.id,
        start_date: startDate,
        end_date: endDate,
        pickup_location: pickupLocation,
        return_location: returnLocation,
        insurance_id: insuranceId ? parseInt(insuranceId) : null,
        notes: notes || null,
      });
      toast.success("Réservation effectuée avec succès !");
      router.push("/client/my-rentals");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la réservation");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Chargement des détails du véhicule...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Véhicule introuvable</h2>
          <p className="text-muted-foreground">Ce véhicule n&apos;existe plus ou a été retiré du catalogue.</p>
          <Button onClick={() => router.push("/vehicles")}>Retour au catalogue</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      {vehicle && <VehicleJsonLd vehicle={vehicle} />}
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl space-y-4">
        <div>
          <BackButton
            href={user?.role === "client" ? "/client/vehicles" : "/vehicles"}
            label={user?.role === "client" ? "Retour à mon espace" : "Retour au catalogue"}
          />
        </div>

        <div className="bg-card rounded-2xl border shadow-lg overflow-hidden flex flex-col lg:flex-row">
          {/* Colonne gauche : Image, fiche technique et présentation */}
          <div className="lg:w-1/2 bg-muted/30 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r flex flex-col justify-between">
            <div className="space-y-6">
              <div className="rounded-xl overflow-hidden border bg-background shadow-xs">
                <VehicleImage
                  src={vehicle.image}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  containerClassName="aspect-video w-full relative overflow-hidden"
                />
              </div>

              <div>
                <span className="uppercase tracking-wider text-[11px] text-primary font-bold px-3 py-1 bg-primary/10 rounded-full inline-block mb-3">
                  {vehicle.category?.name || "Standard"}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Année de mise en circulation {vehicle.year} • Immatriculation {vehicle.license_plate}
                </p>
              </div>

              {/* Spécifications techniques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                <div className="p-3 bg-card rounded-xl border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">Boîte</span>
                  <span className="font-bold text-sm text-foreground capitalize mt-0.5 block">
                    {vehicle.transmission === "automatic" ? "Automatique" : "Manuelle"}
                  </span>
                </div>
                <div className="p-3 bg-card rounded-xl border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">Carburant</span>
                  <span className="font-bold text-sm text-foreground capitalize mt-0.5 block">
                    {vehicle.fuel_type}
                  </span>
                </div>
                <div className="p-3 bg-card rounded-xl border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">Places</span>
                  <span className="font-bold text-sm text-foreground mt-0.5 block">
                    {vehicle.seats} personnes
                  </span>
                </div>
                <div className="p-3 bg-card rounded-xl border">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">Compteur</span>
                  <span className="font-bold text-sm text-foreground mt-0.5 block">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "Récent"}
                  </span>
                </div>
              </div>

              {/* Inclusions garanties */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Inclus dans chaque location :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Assurance responsabilité civile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Assistance dépannage 7j/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Kilométrage généreux inclus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Nettoyage certifié avant départ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground font-medium">Tarif journalier de base</span>
              <span className="text-3xl font-extrabold text-foreground">
                {formatPrice(vehicle.daily_rate)}{" "}
                <span className="text-xs font-normal text-muted-foreground">/jour</span>
              </span>
            </div>
          </div>

          {/* Colonne droite : Calculateur de devis en temps réel & formulaire */}
          <div className="p-6 sm:p-8 lg:w-1/2 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <h2 className="text-2xl font-extrabold tracking-tight">Réserver ce véhicule</h2>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  vehicle.status === "available"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/15 text-red-600"
                }`}>
                  {vehicle.status === "available" ? "Disponible" : "Indisponible"}
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="p-3.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-500/30 text-xs flex items-center gap-2">
                  <UserCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Connecté en tant qu&apos;<strong>administrateur</strong>. Les réservations sont réservées aux comptes clients.</span>
                </div>
              )}

              {/* Champs de dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Date de début
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Date de fin
                  </label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Lieux / Agences prédéfinies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Agence de retrait
                  </label>
                  <select
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                  >
                    {AGENCIES.map((ag) => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Agence de retour
                  </label>
                  <select
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                  >
                    {AGENCIES.map((ag) => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option Assurance */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Protection & Assurance
                </label>
                <select
                  value={insuranceId}
                  onChange={(e) => setInsuranceId(e.target.value)}
                  className="w-full h-11 px-3 border rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="">Assurance Tiers (Incluse)</option>
                  {insurances.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.name} (+{formatPrice(ins.daily_rate)}/jour) • {ins.coverage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions spéciales */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Notes / Demandes particulières (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Siège bébé requis, heure d'arrivée de vol..."
                  rows={2}
                  className="w-full p-3 border rounded-xl bg-background text-sm resize-none focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Récapitulatif Devis Calculé Dynamiquement */}
            <div className="space-y-4 pt-4 border-t">
              {checking ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Calcul du tarif en direct...</span>
                </div>
              ) : isAvailable === false ? (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{availabilityMessage || "Ce véhicule n'est pas disponible sur ce créneau."}</span>
                </div>
              ) : quote ? (
                <div className="bg-muted/40 p-4 rounded-xl border space-y-2.5">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Durée de location</span>
                    <span className="font-bold text-foreground">{quote.total_days} jour{quote.total_days > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Sous-total véhicule</span>
                    <span>{formatPrice(quote.subtotal)}</span>
                  </div>
                  {quote.insurance_total > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Option assurance ({quote.insurance_name})</span>
                      <span className="text-primary font-bold">+{formatPrice(quote.insurance_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t text-foreground">
                    <span className="text-sm font-bold">Total à payer</span>
                    <span className="text-2xl font-extrabold text-primary">{formatPrice(quote.total_amount)}</span>
                  </div>
                </div>
              ) : null}

              {/* Bouton d'action */}
              <Button
                size="lg"
                className="w-full h-13 text-base font-bold shadow-md bg-gradient-to-r from-primary to-blue-600 text-white"
                onClick={handleBooking}
                disabled={booking || checking || !isAvailable || vehicle.status !== "available" || user?.role === "admin"}
              >
                {!user ? "Se connecter pour réserver" :
                 vehicle.status !== "available" ? "Véhicule indisponible" :
                 user.role === "admin" ? "Réservé aux comptes clients" :
                 booking ? "Confirmation en cours..." : "Confirmer la réservation"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
