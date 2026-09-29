import { Vehicle } from "@/types/vehicle";
import { getImageUrl } from "@/lib/utils";

export function VehicleJsonLd({ vehicle }: { vehicle: Vehicle }) {
  if (!vehicle) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";
  const vehicleUrl = `${siteUrl}/vehicles/${vehicle.id}`;
  const resolvedImage = vehicle.image ? getImageUrl(vehicle.image) : null;
  const imageUrl = resolvedImage || `${siteUrl}/toumai-drive-logo.jpg`;

  const vehicleData = {
    "@context": "https://schema.org",
    "@type": ["Vehicle", "Product"],
    "@id": `${vehicleUrl}/#vehicle`,
    "name": `${vehicle.brand} ${vehicle.model} ${vehicle.year || ""}`.trim(),
    "image": imageUrl,
    "description":
      `Location de ${vehicle.brand} ${vehicle.model} à N'Djamena et au Tchad chez Toumaï Drive. Flotte récente, climatisée et révisée.`,
    "brand": {
      "@type": "Brand",
      "name": vehicle.brand,
    },
    "model": vehicle.model,
    "vehicleModelDate": vehicle.year ? String(vehicle.year) : undefined,
    "fuelType": vehicle.fuel_type || undefined,
    "vehicleTransmission": vehicle.transmission || undefined,
    "numberOfSeats": vehicle.seats || undefined,
    "offers": {
      "@type": "Offer",
      "url": vehicleUrl,
      "priceCurrency": "XAF",
      "price": vehicle.daily_rate || vehicle.daily_price || 0,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/UsedCondition",
      "availability":
        vehicle.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "AutoRental",
        "name": "Toumaï Drive",
        "url": siteUrl,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleData) }}
    />
  );
}
