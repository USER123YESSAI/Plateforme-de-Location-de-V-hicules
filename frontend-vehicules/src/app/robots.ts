import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/vehicles",
          "/vehicles/*",
          "/conditions-utilisation",
          "/politique-confidentialite",
          "/terms",
          "/privacy",
          "/login",
          "/register",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/client",
          "/client/*",
          "/dashboard",
          "/dashboard/*",
          "/my-rentals",
          "/my-rentals/*",
          "/test-api",
          "/test-api/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
