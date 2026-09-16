import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Agrega al carrito real de la tienda (WooCommerce) un producto a la vez,
// navegando esta WebView por cada URL de "?add-to-cart=..." en secuencia
// (cada carga completa de página confirma que el servidor ya procesó esa
// adición), y termina mostrando el carrito real de la tienda — sin sacar a
// la clienta de la app ni abrir el navegador externo varias veces.
export default function StoreCheckoutScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { addToCartUrls = [], cartUrl, storeName } = route?.params || {};

  const [stepIndex, setStepIndex] = useState(0);
  const isAddingItems = stepIndex < addToCartUrls.length;
  const currentUrl = isAddingItems ? addToCartUrls[stepIndex] : cartUrl;

  const handleLoadEnd = () => {
    if (isAddingItems) setStepIndex((i) => i + 1);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{storeName || 'Tienda'}</Text>
          <View style={styles.headerBtn} />
        </View>
      </LinearGradient>

      {currentUrl ? (
        <WebView
          source={{ uri: currentUrl }}
          onLoadEnd={handleLoadEnd}
          style={{ flex: 1 }}
          // Incognito: cada visita a esta pantalla arranca con el carrito de
          // la tienda vacío, sin arrastrar productos que hayan quedado de una
          // compra anterior (evita choques con límites de stock). Al no
          // cambiar la key del WebView entre pasos, todas las URLs de esta
          // secuencia SÍ comparten la misma sesión entre sí — solo se aísla
          // de visitas anteriores/futuras, no entre los pasos de una misma.
          incognito
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>No pudimos abrir el carrito de esta tienda.</Text>
        </View>
      )}

      {isAddingItems && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayCard}>
            <ActivityIndicator size="small" color="#BF789C" />
            <Text style={styles.overlayText}>
              Agregando productos ({stepIndex + 1}/{addToCartUrls.length})...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5F8' },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#BBB', fontSize: 14, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  overlayCard: {
    marginTop: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  overlayText: { fontSize: 13, fontWeight: '600', color: '#2D2D2D' },
});
