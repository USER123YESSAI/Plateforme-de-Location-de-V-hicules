import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue des Véhicules & 4x4 de Location",
  description:
    "Découvrez notre gamme complète de véhicules à louer à N'Djamena et au Tchad : 4x4 Toyota, SUV confortables, berlines économiques et pickups. Réservez en ligne avec assurance incluse.",
  alternates: {
    canonical: "/vehicles",
  },
  openGraph: {
    title: "Catalogue des Véhicules & 4x4 | Toumaï Drive Tchad",
    description:
      "Large choix de voitures et 4x4 récents à louer à N'Djamena. Tarifs journaliers transparents et disponibilité immédiate.",
    url: "/vehicles",
  },
};

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
