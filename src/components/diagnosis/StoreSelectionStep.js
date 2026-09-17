import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { COUNTRY_OPTIONS } from '../../data/diagnosisQuestions';
import { haversineKm } from '../../utils/geo';
import styles from '../DiagnosisScreen.styles';

function OptionCard({ title, desc, onPress }) {
  return (
    <TouchableOpacity
      style={styles.optionCard}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.optionCardInner}>
        <View style={styles.optionRadio} />
        <View style={styles.optionTextBlock}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDesc}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function storeDesc(store, distancia) {
  const parts = [];
  if (store.ciudad) parts.push(store.ciudad);
  else if (store.direccion) parts.push(store.direccion);
  if (distancia != null) {
    parts.push(distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Diagnóstico con el catálogo de esta tienda';
}

export default function StoreSelectionStep({ country, stores, loadingStores, onSelectCountry, onSelectStore }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const showingCountry = !country;
  const title = showingCountry ? '¿En qué país estás?' : '¿Con qué tienda quieres hacer tu diagnóstico?';
  const stepLabel = showingCountry ? 'Antes de empezar' : `Tiendas en ${country}`;

  // Ubicación best-effort, solo para ordenar por cercanía — si no hay permiso
  // o falla, la lista simplemente queda sin ordenar por distancia.
  useEffect(() => {
    if (showingCountry || stores.length === 0) return;
    let cancelled = false;
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (cancelled || status !== 'granted') return null;
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      })
      .then((loc) => { if (loc && !cancelled) setUserLocation(loc.coords); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [showingCountry, stores.length]);

  const storesConDistancia = useMemo(() => {
    return stores
      .map((store) => ({
        ...store,
        distancia: userLocation && store.lat != null && store.lng != null
          ? haversineKm(userLocation.latitude, userLocation.longitude, store.lat, store.lng)
          : null,
      }))
      .sort((a, b) => {
        if (a.distancia == null && b.distancia == null) return (a.nombre || '').localeCompare(b.nombre || '');
        if (a.distancia == null) return 1;
        if (b.distancia == null) return -1;
        return a.distancia - b.distancia;
      });
  }, [stores, userLocation]);

  const query = search.trim().toLowerCase();
  const storesFiltrados = query
    ? storesConDistancia.filter((s) =>
        (s.nombre || '').toLowerCase().includes(query) || (s.ciudad || '').toLowerCase().includes(query)
      )
    : storesConDistancia;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.quizHeader, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ width: 60 }} />
          <Text style={styles.headerTitle}>Diagnóstico Capilar</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideContent}>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <Text style={styles.question}>{title}</Text>

        {showingCountry ? (
          <View style={styles.optionsContainer}>
            {COUNTRY_OPTIONS.map((opt) => (
              <OptionCard key={opt.value} title={opt.title} desc={opt.desc} onPress={() => onSelectCountry(opt.value)} />
            ))}
          </View>
        ) : loadingStores ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D6A4A4" />
            <Text style={styles.loadingText}>Buscando tiendas...</Text>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            {stores.length > 0 && (
              <View style={localStyles.searchBox}>
                <Ionicons name="search-outline" size={17} color="#BBB" />
                <TextInput
                  style={localStyles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o ciudad"
                  placeholderTextColor="#BBB"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Buscar tienda por nombre o ciudad"
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearch('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar búsqueda"
                  >
                    <Ionicons name="close-circle" size={17} color="#CCC" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {query && storesFiltrados.length === 0 && (
              <View style={localStyles.emptySearch}>
                <Ionicons name="search-outline" size={32} color="#EDD0D8" />
                <Text style={localStyles.emptySearchText}>
                  No encontramos tiendas para "{search}".
                </Text>
              </View>
            )}

            {storesFiltrados.map((store) => (
              <OptionCard
                key={store.id}
                title={store.nombre}
                desc={storeDesc(store, store.distancia)}
                onPress={() => onSelectStore(store.id)}
              />
            ))}

            <OptionCard
              title="Diagnóstico genérico"
              desc="Recomendaciones con el catálogo general (Amazon)"
              onPress={() => onSelectStore(null)}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D2D2D',
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptySearchText: {
    fontSize: 13,
    color: '#BBB',
    textAlign: 'center',
  },
});
