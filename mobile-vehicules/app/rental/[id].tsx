import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Rental } from '../../src/types';
import { Colors, BorderRadius } from '../../src/constants/theme';
import { formatDate, formatPrice } from '../../src/utils/formatters';
import { Badge } from '../../src/components/Badge';
import { HeaderLogo } from '../../src/components/HeaderLogo';
import {
  Calendar,
  MapPin,
  Car,
  User,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  FileCheck,
  Clock,
  Zap,
  CreditCard,
} from 'lucide-react-native';

export default function RentalVoucherScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingWithChariow, setPayingWithChariow] = useState<boolean>(false);

  useEffect(() => {
    loadRental();
  }, [id]);

  async function loadRental() {
    try {
      const res = await api.get(`/rentals/${id}`);
      if (res.data?.data) {
        setRental(res.data.data);
      }
    } catch (e) {
      console.warn('Erreur chargement location:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleChariowPayment = async () => {
    if (!rental) return;
    setPayingWithChariow(true);
    try {
      const res = await api.post(`/rentals/${rental.id}/chariow-checkout`);
      if (res.data?.checkout_url) {
        Linking.openURL(res.data.checkout_url).catch(() => {
          Alert.alert('Erreur', 'Impossible d’ouvrir le navigateur pour le paiement.');
        });
      } else {
        Alert.alert('Information', res.data?.message || 'Erreur lors de l’initialisation de Chariow.');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur de connexion avec Chariow.');
    } finally {
      setPayingWithChariow(false);
    }
  };

  const callAgency = () => {
    Linking.openURL('tel:+23566000000').catch(() => {
      Alert.alert('Assistance', 'Appelez le +235 66 00 00 00');
    });
  };

  const whatsappAgency = () => {
    Linking.openURL('https://wa.me/23599000000').catch(() => {
      Alert.alert('WhatsApp', 'Contactez le +235 99 00 00 00 sur WhatsApp');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement du bon de réservation...</Text>
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Réservation introuvable.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'primary' | 'neutral' | 'danger' }> = {
    pending: { label: 'En attente', variant: 'warning' },
    confirmed: { label: 'Confirmée & Réservée', variant: 'success' },
    active: { label: 'En cours', variant: 'primary' },
    completed: { label: 'Terminée', variant: 'neutral' },
    cancelled: { label: 'Annulée', variant: 'danger' },
  };

  const currentStatus = statusConfig[rental.status] || { label: rental.status, variant: 'neutral' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête officiel du Bon */}
      <View style={styles.headerCard}>
        <HeaderLogo size="sm" />
        <View style={styles.refRow}>
          <View>
            <Text style={styles.refLabel}>RÉFÉRENCE OFFICIELLE</Text>
            <Text style={styles.refNumber}>#{String(rental.id).padStart(5, '0')}</Text>
          </View>
          <Badge label={currentStatus.label} variant={currentStatus.variant} size="md" />
        </View>
      </View>

      {/* SECTION CRUCIALE : MODALITÉS DU JOUR DE DÉPART (PRISE EN CHARGE) */}
      <View style={styles.departureSection}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color="#1d4ed8" />
          <Text style={styles.departureSectionTitle}>
            Modalités du Jour de Départ (Prise en Charge)
          </Text>
        </View>

        {/* Boîte Départ */}
        <View style={styles.flightBox}>
          <View style={styles.boxHeaderRow}>
            <Text style={styles.boxTag}>🛫 DÉPART & RETRAIT</Text>
            <Text style={styles.boxDate}>{formatDate(rental.start_date)}</Text>
          </View>
          <Text style={styles.boxTime}>Mise à disposition : à partir de 08h00</Text>
          <Text style={styles.boxLocation}>
            📍 Lieu : <Text style={styles.bold}>{rental.pickup_location || "Agence Centrale Toumaï Drive (N'Djamena)"}</Text>
          </Text>
        </View>

        {/* Boîte Restitution */}
        <View style={[styles.flightBox, { marginTop: 10 }]}>
          <View style={styles.boxHeaderRow}>
            <Text style={styles.boxTag}>🛬 RETOUR & RESTITUTION</Text>
            <Text style={styles.boxDate}>{formatDate(rental.end_date)}</Text>
          </View>
          <Text style={styles.boxTime}>Heure limite : avant 18h00</Text>
          <Text style={styles.boxLocation}>
            📍 Lieu : <Text style={styles.bold}>{rental.return_location || "Agence Centrale Toumaï Drive (N'Djamena)"}</Text>
          </Text>
        </View>

        {rental.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Instructions spécifiques :</Text>
            <Text style={styles.notesVal}>{rental.notes}</Text>
          </View>
        )}
      </View>

      {/* CHECKLIST DU JOUR DU DÉPART */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeader}>
          <FileCheck size={18} color="#b45309" />
          <Text style={styles.checklistTitle}>À présenter le jour de la prise en charge</Text>
        </View>

        <View style={styles.checklistItem}>
          <Text style={styles.checkIcon}>✔</Text>
          <Text style={styles.checkText}>
            <Text style={styles.bold}>Permis de conduire :</Text> Original physique valide obligatoire (+2 ans d'ancienneté).
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Text style={styles.checkIcon}>✔</Text>
          <Text style={styles.checkText}>
            <Text style={styles.bold}>Pièce d'identité :</Text> Carte Nationale d'Identité ou Passeport valide.
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Text style={styles.checkIcon}>✔</Text>
          <Text style={styles.checkText}>
            <Text style={styles.bold}>État des lieux :</Text> Inspection conjointe avant signature du bon de remise des clés.
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Text style={styles.checkIcon}>✔</Text>
          <Text style={styles.checkText}>
            <Text style={styles.bold}>Carburant :</Text> Remis plein, à restituer avec le même niveau.
          </Text>
        </View>
      </View>

      {/* VÉHICULE & CONDUCTEUR */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Car size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Véhicule Attribué</Text>
        </View>

        {rental.vehicle && (
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>
              {rental.vehicle.brand} {rental.vehicle.model} ({rental.vehicle.year})
            </Text>
            <Text style={styles.vehicleSub}>
              Immatriculation : <Text style={styles.bold}>{rental.vehicle.license_plate}</Text> &bull; {rental.vehicle.transmission === 'automatic' ? 'Automatique' : 'Manuelle'} &bull; {rental.vehicle.fuel_type}
            </Text>
          </View>
        )}

        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <User size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Conducteur Principal</Text>
        </View>

        {rental.user && (
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{rental.user.name}</Text>
            <Text style={styles.vehicleSub}>{rental.user.email}</Text>
            {rental.user.phone && <Text style={styles.vehicleSub}>Tél : {rental.user.phone}</Text>}
          </View>
        )}
      </View>

      {/* DÉTAILS FINANCIERS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Récapitulatif Financier</Text>

        <View style={styles.financeRow}>
          <Text style={styles.financeLabel}>
            Location ({rental.total_days} jours x {formatPrice(rental.daily_rate)})
          </Text>
          <Text style={styles.financeVal}>{formatPrice(rental.subtotal)}</Text>
        </View>

        {rental.insurance_total ? (
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>
              Assurance ({rental.insurance?.name || 'Complémentaire'})
            </Text>
            <Text style={styles.financeVal}>{formatPrice(rental.insurance_total)}</Text>
          </View>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL RÉGLÉ / DÛ :</Text>
          <Text style={styles.totalVal}>{formatPrice(rental.total_amount)}</Text>
        </View>

        {rental.status === 'pending' && (
          <View style={styles.chariowSection}>
            <TouchableOpacity
              style={[styles.chariowBtn, payingWithChariow && styles.chariowBtnDisabled]}
              onPress={handleChariowPayment}
              disabled={payingWithChariow}
              activeOpacity={0.85}
            >
              {payingWithChariow ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Zap size={18} color="#ffffff" />
                  <Text style={styles.chariowBtnText}>Payer en ligne avec Chariow</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.chariowSubText}>
              Paiement sécurisé : Wave, Orange Money, Moov, Carte bancaire
            </Text>
          </View>
        )}

        {rental.payment && (
          <View style={styles.paymentSuccessBox}>
            <ShieldCheck size={16} color="#15803d" />
            <Text style={styles.paymentSuccessText}>
              Règlement validé le {formatDate(rental.payment.paid_at)} &bull; Réf: {rental.payment.transaction_id}
            </Text>
          </View>
        )}
      </View>

      {/* ASSISTANCE RAPIDE */}
      <View style={styles.supportActions}>
        <TouchableOpacity style={styles.callBtn} onPress={callAgency}>
          <PhoneCall size={18} color="#ffffff" />
          <Text style={styles.callBtnText}>Appeler l'Agence</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappBtn} onPress={whatsappAgency}>
          <MessageSquare size={18} color="#ffffff" />
          <Text style={styles.callBtnText}>WhatsApp 24/7</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: Colors.danger,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  refNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  departureSection: {
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  departureSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  flightBox: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  boxTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },
  boxDate: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  boxTime: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  boxLocation: {
    fontSize: 12.5,
    color: Colors.text,
  },
  bold: {
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  notesVal: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  checklistCard: {
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  checklistTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  checkIcon: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '800',
  },
  checkText: {
    fontSize: 12,
    color: '#78350f',
    flex: 1,
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
  },
  vehicleDetails: {
    marginTop: 2,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  vehicleSub: {
    fontSize: 12.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  financeLabel: {
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  financeVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  paymentSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 12,
  },
  paymentSuccessText: {
    fontSize: 11.5,
    color: '#15803d',
    fontWeight: '600',
    flex: 1,
  },
  supportActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  chariowSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chariowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chariowBtnDisabled: {
    opacity: 0.7,
  },
  chariowBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  chariowSubText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
