import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ShieldCheck, Clock } from "lucide-react";

function FooterBrand() {
  return (
    <div className="lg:col-span-2 space-y-4">
      <Link href="/" className="flex items-center group" aria-label="Toumaï Drive">
        <Image
          src="/toumai-drive-logo.jpg"
          alt="Toumaï Drive"
          width={200}
          height={122}
          className="h-14 sm:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </Link>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
        Votre partenaire de mobilité premium au Tchad. Réservation en ligne instantanée, véhicules récents, tarifs transparents et assistance 7j/7.
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Assurance tous risques</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span>Support 7j/7</span>
        </div>
      </div>
    </div>
  );
}

function FooterNavigation() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Navigation</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">
            Accueil
          </Link>
        </li>
        <li>
          <Link href="/vehicles" className="hover:text-primary transition-colors">
            Tous nos véhicules
          </Link>
        </li>
        <li>
          <Link href="/#how-it-works" className="hover:text-primary transition-colors">
            Comment ça marche
          </Link>
        </li>
        <li>
          <Link href="/#features" className="hover:text-primary transition-colors">
            Nos avantages
          </Link>
        </li>
        <li>
          <Link href="/client/my-rentals" className="hover:text-primary transition-colors">
            Mes réservations
          </Link>
        </li>
      </ul>
    </div>
  );
}

function FooterAgencies() {
  const agencies = [
    "Aéroport Hassan Djamous (NDJ)",
    "N\u0027Djamena Centre-ville",
    "N\u0027Djamena Sabangali",
    "Moundou Centre",
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Nos Agences</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {agencies.map((agency) => (
          <li key={agency} className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{agency}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterContact() {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h4>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary shrink-0" />
          <span>+235 66 00 00 00</span>
        </li>
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span>contact@toumaidrive.td</span>
        </li>
        <li className="pt-2">
          <span className="text-xs bg-muted/70 px-2.5 py-1 rounded-md text-foreground font-medium inline-block">
            Ouvert 7j/7 • 07h00 - 22h00
          </span>
        </li>
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-card border-t text-foreground">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <FooterBrand />
          <FooterNavigation />
          <FooterAgencies />
          <FooterContact />
        </div>

        {/* Ligne inférieure de Copyright */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Toumaï Drive. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <Link href="/conditions-utilisation" className="hover:text-primary transition-colors">
              Conditions d'utilisation
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-primary transition-colors">
              Politique de Confidentialité
            </Link>
            <span className="text-muted-foreground/60">Mentions Légales</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
