import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Rental } from '../../src/types';
import { Colors, BorderRadius } from '../../src/constants/theme';
import { RentalCard } from '../../src/components/RentalCard';
import { useAuth } from '../../src/context/AuthContext';
import { Calendar, LogIn, RefreshCw } from 'lucide-react-native';

function AuthPrompt() {
  const router = useRouter();

  return (
    <View style={styles.authPromptContainer}>
      <View style={styles.authIconWrapper}>
        <Calendar size={36} color={Colors.primary} />
      </View>
      <Text style={styles.authTitle}>Suivez vos réservations</Text>
      <Text style={styles.authSubtitle}>
        Connectez-vous à votre compte Toumaï Drive pour accéder à vos locations en cours, télécharger vos bons de prise en charge et consulter votre historique.
      </Text>

      <TouchableOpacity
        style={styles.authButton}
        onPress={() => router.push('/login')}
        activeOpacity={0.8}
      >
        <LogIn size={18} color="#ffffff" />
        <Text style={styles.authButtonText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyRentals() {
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Calendar size={48} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Aucune réservation pour le moment</Text>
      <Text style={styles.emptySubtitle}>
        Choisissez un véhicule dans le catalogue et réservez-le en quelques secondes.
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.exploreBtnText}>Explorer les véhicules</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RentalsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadRentals = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.get('/my-rentals');
      if (res.data?.data?.data) {
        // Laravel paginate format
        setRentals(res.data.data.data);
      } else if (Array.isArray(res.data?.data)) {
        setRentals(res.data.data);
      }
    } catch (e) {
      console.warn('Erreur chargement réservations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRentals();
  };

  // État Non Connecté
  if (!user || !token) {
    return <AuthPrompt />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rentals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RentalCard
            rental={item}
            onPress={() => router.push(`/rental/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Historique & Réservations Actives</Text>
            <Text style={styles.headerSubtitle}>
              Retrouvez ici vos réservations et vos bons de prise en charge officiels.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Chargement de vos réservations...</Text>
            </View>
          ) : (
            <EmptyRentals />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingVertical: 14,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: Colors.textMuted,
    marginTop: 3,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: 20,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  authPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
  },
  authIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13.5,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
