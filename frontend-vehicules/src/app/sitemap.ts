import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const now = new Date();

  // Pages statiques principales avec leurs priorités SEO et fréquences
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/vehicles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/conditions-utilisation`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/politique-confidentialite`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Récupération dynamique des véhicules depuis le backend pour enrichir le sitemap
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/vehicles`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const vehicles = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      vehiclePages = vehicles
        .filter(
          (vehicle: { id: number; status?: string }) =>
            !vehicle.status || vehicle.status === "available"
        )
        .map(
          (vehicle: {
            id: number;
            updated_at?: string;
            created_at?: string;
          }) => ({
            url: `${siteUrl}/vehicles/${vehicle.id}`,
            lastModified: vehicle.updated_at
              ? new Date(vehicle.updated_at)
              : vehicle.created_at
              ? new Date(vehicle.created_at)
              : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          })
        );
    }
  } catch (error) {
    // Si l'API est temporairement inaccessible (ex: étape de build isolée), on préserve le sitemap statique
    console.warn(
      "[Sitemap] API non joignable lors de la génération dynamique :",
      error instanceof Error ? error.message : String(error)
    );
  }

  return [...staticPages, ...vehiclePages];
}
