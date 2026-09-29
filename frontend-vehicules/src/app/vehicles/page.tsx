"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Vehicle, Category } from "@/types/vehicle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VehicleImage } from "@/components/ui/vehicle-image";
import { SkeletonCard } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Filter, SlidersHorizontal, RotateCcw, Car } from "lucide-react";

function PublicVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col justify-between border">
      <div>
        <div className="relative">
          <VehicleImage
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur-md shadow-xs border">
            {vehicle.category?.name || "Standard"}
          </span>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
            {vehicle.brand} {vehicle.model}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Modèle {vehicle.year} • {vehicle.seats} places
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="px-2.5 py-0.5 rounded-md bg-muted/70 capitalize font-medium">
              {vehicle.transmission === "automatic" ? "Boîte Auto" : "Manuelle"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-muted/70 capitalize font-medium">
              {vehicle.fuel_type}
            </span>
          </div>

          <div className="flex items-baseline gap-1 pt-2 border-t border-border/50">
            <span className="text-2xl font-extrabold text-primary">{formatPrice(vehicle.daily_rate)}</span>
            <span className="text-xs text-muted-foreground">/jour</span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-0">
        <Link href={`/vehicles/${vehicle.id}`} className="w-full">
          <Button className="w-full font-semibold shadow-xs">
            Voir & Réserver
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function VehiclesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category_id") || "";
  const initialSearch = searchParams.get("search") || "";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedTransmission, setSelectedTransmission] = useState<string>("");
  const [selectedFuel, setSelectedFuel] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Récupération des catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const data = res.data.data || res.data || [];
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Récupération des véhicules filtrés
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | undefined> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedTransmission) params.transmission = selectedTransmission;
      if (selectedFuel) params.fuel_type = selectedFuel;
      if (maxPrice) params.max_price = maxPrice;

      const response = await api.get('/vehicles', { params });
      const data = response.data.data || response.data || [];
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[Location Express] Failed to fetch vehicles:", error);
      toast.error("Impossible de charger les véhicules");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedTransmission, selectedFuel, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedTransmission("");
    setSelectedFuel("");
    setMaxPrice("");
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedTransmission || selectedFuel || maxPrice);

  return (
    <main className="container mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Notre Flotte de Véhicules</h1>
          <p className="text-muted-foreground mt-1">
            Trouvez le véhicule idéal pour tous vos déplacements au meilleur prix.
          </p>
        </div>
        <div className="text-sm font-semibold text-foreground bg-card px-4 py-2 rounded-full border shadow-2xs self-start md:self-auto flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <span>{vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""} disponible{vehicles.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-card p-5 sm:p-6 rounded-2xl border shadow-sm mb-8 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-sm font-bold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filtres de recherche</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Recherche textuelle */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Marque ou modèle
            </label>
            <Input
              type="text"
              placeholder="Ex: Peugeot, Toyota, Mercedes, Tesla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background h-10"
            />
          </div>

          {/* Sélecteur de catégorie */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Catégorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Boîte de vitesses */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Boîte de vitesses
            </label>
            <select
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Toutes</option>
              <option value="automatic">Automatique</option>
              <option value="manual">Manuelle</option>
            </select>
          </div>

          {/* Carburant */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Motorisation
            </label>
            <select
              value={selectedFuel}
              onChange={(e) => setSelectedFuel(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Tous</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Électrique</option>
              <option value="hybrid">Hybride</option>
            </select>
          </div>
        </div>

        {/* Deuxième rangée : Prix max et reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix max/jour :</span>
            <div className="flex items-center gap-2 flex-wrap">
              {[30000, 50000, 100000].map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setMaxPrice(maxPrice === String(price) ? "" : String(price))}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    maxPrice === String(price)
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  &le; {formatPrice(price)}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Réinitialiser les filtres</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grille de Véhicules */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-card rounded-2xl border p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Car className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold">Aucun véhicule disponible</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aucun modèle ne correspond à vos critères actuels. Essayez d&apos;élargir vos filtres ou de réinitialiser la recherche.
          </p>
          {hasActiveFilters && (
            <Button onClick={handleResetFilters} variant="outline" size="sm" className="mt-2">
              Effacer tous les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <PublicVehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function VehiclesPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      <Navbar />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }>
        <VehiclesContent />
      </Suspense>
      <Footer />
    </div>
  );
}
