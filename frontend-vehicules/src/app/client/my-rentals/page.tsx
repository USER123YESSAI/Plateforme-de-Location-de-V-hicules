"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Rental } from "@/types/rental";
import { PaymentMethod } from "@/types/payment";
import { toast } from "sonner";
import { CreditCard, FileText, XCircle, Calendar, Smartphone, Building2, Banknote, Check, Zap } from "lucide-react";
import Link from "next/link";

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingRental, setPayingRental] = useState<Rental | null>(null);
  const [cancellingRentalId, setCancellingRentalId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("chariow");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const { user } = useAuth();
  const router = useRouter();

  const fetchRentals = useCallback(async (statusVal = statusFilter, yearVal = yearFilter) => {
    setLoading(true);
    try {
      const response = await api.get('/my-rentals', {
        params: {
          status: statusVal !== 'all' ? statusVal : undefined,
          year: yearVal !== 'all' ? yearVal : undefined
        }
      });
      const data = response.data.data?.data || response.data.data || response.data;
      setRentals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[Location Express] Failed to fetch user rentals:", error);
      toast.error("Impossible de récupérer vos locations");
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, yearFilter]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchRentals(statusFilter, yearFilter);

    // Détection d'un retour après paiement Chariow
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment") === "chariow_return") {
        toast.success("Retour de la passerelle Chariow ! Votre réservation est en cours de validation.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, router, statusFilter, yearFilter, fetchRentals]);

  const confirmCancel = async () => {
    if (!cancellingRentalId) return;
    setSubmittingCancel(true);
    try {
      await api.patch(`/rentals/${cancellingRentalId}/cancel`);
      toast.success("Réservation annulée avec succès");
      setCancellingRentalId(null);
      fetchRentals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'annulation");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRental) return;
    setSubmittingPayment(true);

    try {
      // 1. Flux Chariow (Passerelle sécurisée en ligne)
      if (paymentMethod === "chariow") {
        const res = await api.post(`/rentals/${payingRental.id}/chariow-checkout`);
        if (res.data?.checkout_url) {
          toast.success(
            res.data.simulated
              ? "Session Chariow (Mode Test) initiée."
              : "Redirection vers la passerelle sécurisée Chariow..."
          );
          window.location.href = res.data.checkout_url;
          return;
        }
      }

      // 2. Flux direct standard
      await api.post(`/rentals/${payingRental.id}/pay`, {
        payment_method: paymentMethod,
        transaction_id: `TX-${Date.now()}`
      });
      toast.success("Paiement effectué avec succès ! Votre réservation est confirmée.");
      setPayingRental(null);
      fetchRentals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du règlement de la réservation");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const downloadInvoice = async (rentalId: number) => {
    const toastId = toast.loading("Génération de la facture en cours...");
    try {
      const response = await api.get(`/rentals/${rentalId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${rentalId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Facture téléchargée avec succès", { id: toastId });
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Erreur lors du téléchargement de la facture", { id: toastId });
    }
  };

  const stats = {
    active: rentals.filter((r) => ["confirmed", "active"].includes(r.status)).length,
    pending: rentals.filter((r) => r.status === "pending").length,
    completed: rentals.filter((r) => r.status === "completed").length,
    totalSpent: rentals
      .filter((r) => r.status !== "cancelled")
      .reduce((acc, r) => acc + (parseFloat(String(r.total_amount)) || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Mes Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consultez vos réservations actives, effectuez vos paiements et téléchargez vos factures.
          </p>
        </div>
        <Link href="/client/vehicles">
          <Button className="rounded-xl shadow-xs text-xs sm:text-sm">
            Nouvelle Réservation
          </Button>
        </Link>
      </div>

      {/* KPI Stats Cards - Élimine les espaces vides et donne de la valeur immédiate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">Locations actives</p>
          <p className="text-xl sm:text-2xl font-black text-primary mt-1">{stats.active}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">En cours ou confirmées</p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">En attente de paiement</p>
          <p className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{stats.pending}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">À régler pour valider</p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">Terminées</p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1">{stats.completed}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Historique archivé</p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted-foreground">Total engagé</p>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {formatPrice(stats.totalSpent)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sur toutes vos locations</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-xl border shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut :</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs sm:text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Filtrer par statut"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente (pending)</option>
              <option value="confirmed">Confirmé (confirmed)</option>
              <option value="active">En cours (active)</option>
              <option value="completed">Terminé (completed)</option>
              <option value="cancelled">Annulé (cancelled)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Année :</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs sm:text-sm bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Filtrer par année"
            >
              <option value="all">Toutes les années</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {rentals.length} réservation{rentals.length > 1 ? "s" : ""} trouvée{rentals.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Tableau avec conteneur défilant */}
      <div className="bg-card rounded-xl border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Véhicule</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Lieux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTable rows={4} cols={6} />
              ) : rentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="space-y-3">
                      <Calendar className="h-10 w-10 text-muted-foreground mx-auto opacity-30" />
                      <p className="font-medium">Vous n&apos;avez aucune réservation pour le moment.</p>
                      <Link href="/client/vehicles" className="inline-block">
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Découvrir les véhicules
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <div className="font-bold text-sm text-foreground">
                        {rental.vehicle?.brand} {rental.vehicle?.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rental.vehicle?.category?.name || "Standard"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div>Du {new Date(rental.start_date).toLocaleDateString('fr-FR')}</div>
                      <div className="text-muted-foreground">Au {new Date(rental.end_date).toLocaleDateString('fr-FR')}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {rental.pickup_location || "Agence"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        rental.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        rental.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                        rental.status === 'active' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                        rental.status === 'completed' ? 'bg-muted text-muted-foreground' :
                        rental.status === 'cancelled' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {rental.status === 'confirmed' ? 'Confirmé' :
                         rental.status === 'pending' ? 'En attente' :
                         rental.status === 'active' ? 'En cours' :
                         rental.status === 'completed' ? 'Terminé' :
                         rental.status === 'cancelled' ? 'Annulé' : rental.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-extrabold text-sm text-foreground">
                      {formatPrice(rental.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rental.status === 'pending' && (
                          <Button
                            size="sm"
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
                            onClick={() => setPayingRental(rental)}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Payer</span>
                          </Button>
                        )}
                        {['pending', 'confirmed'].includes(rental.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5"
                            onClick={() => setCancellingRentalId(rental.id)}
                            title="Annuler la réservation"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Annuler</span>
                          </Button>
                        )}
                        {['confirmed', 'active', 'completed'].includes(rental.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs inline-flex items-center gap-1.5"
                            onClick={() => downloadInvoice(rental.id)}
                            title="Télécharger la facture PDF"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Facture</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Modal pour Annulation via ConfirmDialog */}
      <ConfirmDialog
        isOpen={Boolean(cancellingRentalId)}
        title="Annuler cette réservation ?"
        description="Êtes-vous certain de vouloir annuler cette réservation ? Le véhicule sera immédiatement libéré pour d'autres clients."
        confirmText="Confirmer l'annulation"
        cancelText="Conserver ma réservation"
        variant="destructive"
        loading={submittingCancel}
        onConfirm={confirmCancel}
        onCancel={() => setCancellingRentalId(null)}
      />

      {/* Modal Règlement de Paiement */}
      {payingRental && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Régler votre réservation</h3>
                <p className="text-xs text-muted-foreground">Paiement sécurisé en ligne</p>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl text-sm space-y-2 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs font-medium">Véhicule</span>
                <span className="font-bold text-xs">{payingRental.vehicle?.brand} {payingRental.vehicle?.model}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t">
                <span className="text-xs text-muted-foreground font-medium">Montant à régler</span>
                <span className="text-xl font-extrabold text-primary">{formatPrice(payingRental.total_amount)}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Moyen de paiement
                </label>

                {/* Option Chariow Recommandée */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("chariow")}
                  className={`w-full flex items-center justify-between p-3.5 mb-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    paymentMethod === "chariow"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/40 shadow-xs"
                      : "border-border/70 hover:border-primary/50 bg-background text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>Chariow Pay</span>
                        <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-md uppercase">
                          En ligne
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-normal">
                        Wave, Orange Money, Moov, Carte Visa / Mastercard
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">Immédiat &rarr;</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border/60 hover:border-primary/40 bg-background text-foreground"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>Carte directe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mobile_money")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentMethod === "mobile_money"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border/60 hover:border-primary/40 bg-background text-foreground"
                    }`}
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span>Mobile Money direct</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border/60 hover:border-primary/40 bg-background text-foreground"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>Virement bancaire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border/60 hover:border-primary/40 bg-background text-foreground"
                    }`}
                  >
                    <Banknote className="h-4 w-4 shrink-0" />
                    <span>Espèces en agence</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayingRental(null)}
                  disabled={submittingPayment}
                >
                  Fermer
                </Button>
                <Button
                  type="submit"
                  disabled={submittingPayment}
                  className="bg-gradient-to-r from-primary to-blue-600 text-white inline-flex items-center gap-1.5"
                >
                  {paymentMethod === "chariow" ? (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>{submittingPayment ? "Connexion Chariow..." : "Payer via Chariow"}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{submittingPayment ? "Paiement en cours..." : "Confirmer le paiement"}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
