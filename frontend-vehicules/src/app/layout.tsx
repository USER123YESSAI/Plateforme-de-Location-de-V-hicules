import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { TermsUpdateModal } from "@/components/legal/TermsUpdateModal";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { JsonLd } from "@/components/seo/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toumaï Drive | Location de Véhicules & 4x4 à N'Djamena, Tchad",
    template: "%s | Toumaï Drive",
  },
  description:
    "Louez votre véhicule au Tchad avec Toumaï Drive : large choix de 4x4 tout-terrain, berlines d'affaires et SUV récents à N'Djamena et en province. Réservation rapide 7j/7, assurance tous risques et meilleurs prix.",
  keywords: [
    "Toumai Drive",
    "Toumaï Drive",
    "location de véhicule",
    "location de voiture",
    "location voiture Tchad",
    "location voiture N'Djamena",
    "location 4x4 N'Djamena",
    "location 4x4 Tchad",
    "location SUV Tchad",
    "location voiture avec chauffeur",
    "agence location voiture N'Djamena",
    "Aéroport Hassan Djamous location voiture",
    "Yessaïn Nanadoumadji",
  ],
  authors: [{ name: "Yessaïn Nanadoumadji", url: siteUrl }],
  creator: "Yessaïn Nanadoumadji",
  publisher: "Toumaï Drive",
  category: "transportation",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "fr_TD",
    alternateLocale: "fr_FR",
    url: siteUrl,
    siteName: "Toumaï Drive",
    title: "Toumaï Drive | N°1 de la Location de Véhicules au Tchad",
    description:
      "Trouvez et louez facilement votre voiture ou 4x4 à N'Djamena et au Tchad. Véhicules récents, tarifs clairs, assurance complète et assistance 7j/7.",
    images: [
      {
        url: "/toumai-drive-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Toumaï Drive - Location de Véhicules au Tchad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toumaï Drive | Location de Véhicules au Tchad",
    description:
      "Plateforme moderne de location de voitures et 4x4 à N'Djamena. Service client 7j/7 et véhicules climatisés.",
    images: ["/toumai-drive-logo.jpg"],
    creator: "@ToumaiDrive",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Toumaï Drive",
  },
  icons: {
    icon: "/toumai-drive-logo.jpg",
    apple: "/toumai-drive-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground pb-16 md:pb-0">
        <AuthProvider>
          {children}
          <MobileBottomNav />
          <TermsUpdateModal />
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
