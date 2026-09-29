export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toumaidrive.td";
  const logoUrl = `${siteUrl}/toumai-drive-logo.jpg`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["AutoRental", "LocalBusiness"],
        "@id": `${siteUrl}/#organization`,
        "name": "Toumaï Drive",
        "alternateName": [
          "Toumai Drive",
          "Toumaï Drive Tchad",
          "Toumai Drive Location",
          "Toumai Drive N'Djamena"
        ],
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#logo`,
          "url": logoUrl,
          "contentUrl": logoUrl,
          "caption": "Toumaï Drive - Location de Véhicules au Tchad"
        },
        "image": logoUrl,
        "description":
          "Leader de la location de véhicules et de 4x4 au Tchad. Réservation en ligne sécurisée, flotte moderne et entretenue, tarifs transparents avec ou sans chauffeur à N'Djamena et en province.",
        "telephone": "+235 66 00 00 00",
        "email": "contact@toumaidrive.td",
        "priceRange": "30 000 FCFA - 150 000 FCFA",
        "currenciesAccepted": "XAF",
        "paymentAccepted": "Espèces, Virement bancaire, Carte Bancaire, Airtel Money, Moov Money",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Avenue Charles de Gaulle",
          "addressLocality": "N'Djamena",
          "addressRegion": "N'Djamena",
          "postalCode": "BP 1228",
          "addressCountry": "TD"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 12.1348,
          "longitude": 15.0557
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "07:00",
            "closes": "22:00"
          }
        ],
        "founder": {
          "@type": "Person",
          "@id": `${siteUrl}/#founder`,
          "name": "Yessaïn Nanadoumadji",
          "jobTitle": "Fondateur & Directeur Général",
          "url": siteUrl,
          "worksFor": {
            "@id": `${siteUrl}/#organization`
          }
        },
        "areaServed": [
          {
            "@type": "City",
            "name": "N'Djamena"
          },
          {
            "@type": "City",
            "name": "Moundou"
          },
          {
            "@type": "Country",
            "name": "Tchad"
          }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Services de location de véhicules Toumaï Drive",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Location de 4x4 et SUV tout-terrain",
                "description":
                  "Flotte de 4x4 robustes et climatisés (Toyota Prado, Hilux) adaptés aux pistes et missions professionnelles au Tchad."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Location de Berlines économiques & prestige",
                "description":
                  "Véhicules récents et confortables pour vos déplacements urbains et rendez-vous d'affaires à N'Djamena."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Service Chauffeur & Transfert Aéroport",
                "description":
                  "Mise à disposition de chauffeurs expérimentés et navettes depuis l'Aéroport International Hassan Djamous (NDJ)."
              }
            }
          ]
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Toumaï Drive",
        "alternateName": ["Toumai Drive", "Toumaï Drive Tchad"],
        "description": "Plateforme officielle de location de voitures et 4x4 au Tchad",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/vehicles?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "fr"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
