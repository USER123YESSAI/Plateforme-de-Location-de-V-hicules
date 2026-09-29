"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Vehicle, Category } from "@/types/vehicle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleImage } from "@/components/ui/vehicle-image";
import { SkeletonCard } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Search, Fuel, Users, Gauge, Car } from "lucide-react";

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="group overflow-hidden rounded-2xl border bg-card hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <VehicleImage
            src={getImageUrl(vehicle.image)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-background/90 backdrop-blur-xs text-foreground shadow-2xs">
              {vehicle.category?.name || "Standard"}
            </span>
          </div>
        </div>

        {/* En-tête de la carte */}
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                {vehicle.brand} {vehicle.model}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Année {vehicle.year} • {vehicle.transmission === "automatic" ? "Automatique" : "Manuelle"}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Spécifications & Tarifs */}
        <CardContent className="p-4 pt-1 space-y-3">
          <div className="grid grid-cols-3 gap-2 py-2 border-y text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{vehicle.seats} places</span>
            </div>
            <div className="flex items-center gap-1.5 capitalize">
              <Fuel className="h-3.5 w-3.5 text-primary" />
              <span>{vehicle.fuel_type}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              <span>{vehicle.mileage ? `${vehicle.mileage} km` : "Illimité"}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">Tarif journalier</span>
            <div>
              <span className="text-xl font-extrabold text-primary">
                {formatPrice(vehicle.daily_rate)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/jour</span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Bouton de réservation */}
      <CardFooter className="p-4 pt-0">
        <Link href={`/vehicles/${vehicle.id}`} className="w-full">
          <Button className="w-full rounded-xl justify-center group-hover:bg-primary/90 shadow-xs">
            Réserver ce véhicule
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ClientVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vehiclesRes, catRes] = await Promise.all([
          api.get("/vehicles/available").catch(() => api.get("/vehicles")),
          api.get("/categories"),
        ]);
        const vData = vehiclesRes.data.data || vehiclesRes.data || [];
        const cData = catRes.data.data || catRes.data || [];
        setVehicles(Array.isArray(vData) ? vData : []);
        setCategories(Array.isArray(cData) ? cData : []);
      } catch (error) {
        console.error("[Location Express] Error loading client vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        search === "" ||
        `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
        v.category?.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "all" || String(v.category_id) === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [vehicles, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header avec barre de recherche & filtres */}
      <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Véhicules Disponibles
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Parcourez la flotte et réservez instantanément en quelques clics.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
            {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? "s" : ""} disponible{filteredVehicles.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* Contrôles de filtrage */}
        <div className="flex flex-col md:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une marque, un modèle (ex: Toyota, SUV)..."
              className="pl-9 h-10 rounded-xl bg-background"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              type="button"
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-lg text-xs h-9"
            >
              Tous
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={selectedCategory === String(cat.id) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(String(cat.id))}
                className="rounded-lg text-xs h-9"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille des véhicules */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Aucun véhicule trouvé</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aucun véhicule ne correspond à vos critères de recherche.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="rounded-xl"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
