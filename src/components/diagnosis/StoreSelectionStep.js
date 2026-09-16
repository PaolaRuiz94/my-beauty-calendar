import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COUNTRY_OPTIONS } from '../../data/diagnosisQuestions';
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

export default function StoreSelectionStep({ country, stores, loadingStores, onSelectCountry, onSelectStore }) {
  const insets = useSafeAreaInsets();

  const showingCountry = !country;
  const title = showingCountry ? '¿En qué país estás?' : '¿Con qué tienda quieres hacer tu diagnóstico?';
  const stepLabel = showingCountry ? 'Antes de empezar' : `Tiendas en ${country}`;

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
            {stores.map((store) => (
              <OptionCard
                key={store.id}
                title={store.nombre}
                desc={store.direccion || 'Diagnóstico con el catálogo de esta tienda'}
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
