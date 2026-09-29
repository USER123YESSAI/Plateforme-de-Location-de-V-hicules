import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  try {
    const res = await fetch(`${apiUrl}/vehicles/${id}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const vehicle = data.data || data;
      if (vehicle && vehicle.brand) {
        const vehicleTitle = `${vehicle.brand} ${vehicle.model}${
          vehicle.year ? ` (${vehicle.year})` : ""
        } | Location Toumaï Drive`;

        const price = vehicle.daily_rate || vehicle.daily_price;
        const priceText = price
          ? `${Number(price).toLocaleString("fr-FR")} FCFA/jour`
          : "tarif préférentiel";

        const description = `Louez la ${vehicle.brand} ${vehicle.model} au Tchad avec Toumaï Drive. À partir de ${priceText}. Flotte récente, climatisée, assurance tous risques et service 7j/7 à N'Djamena.`;

        const rawImg = vehicle.image || vehicle.image_url;
        let imageUrl = `${siteUrl}/toumai-drive-logo.jpg`;
        if (rawImg) {
          if (rawImg.startsWith("http://") || rawImg.startsWith("https://")) {
            imageUrl = rawImg;
          } else {
            const cleanPath = rawImg.replace(/^\/?storage\//, "").replace(/^\//, "");
            const backendBase = apiUrl.replace(/\/api$/, "");
            imageUrl = `${backendBase}/storage/${cleanPath}`;
          }
        }

        return {
          title: vehicleTitle,
          description,
          alternates: {
            canonical: `/vehicles/${id}`,
          },
          openGraph: {
            title: vehicleTitle,
            description,
            url: `/vehicles/${id}`,
            images: [
              {
                url: imageUrl,
                width: 800,
                height: 600,
                alt: `${vehicle.brand} ${vehicle.model}`,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: vehicleTitle,
            description,
            images: [imageUrl],
          },
        };
      }
    }
  } catch (err) {
    // Si l'API est injoignable lors du build, fallback gracieux
  }

  return {
    title: "Détails du Véhicule de Location",
    description:
      "Réservez votre véhicule de location au Tchad avec Toumaï Drive. Véhicules modernes, révisés et assurés tous risques.",
    alternates: {
      canonical: `/vehicles/${id}`,
    },
  };
}

export default function VehicleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
