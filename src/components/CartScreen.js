import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { buildCartUrl, getProductAsin } from '../utils/amazonUtils';

const defaultProductImage = require('../../assets/icon.png');

function CartItemImage({ product }) {
  const [fallback, setFallback] = useState(false);
  const src =
    !fallback && product.image
      ? { uri: product.image }
      : product.asin
      ? { uri: `https://m.media-amazon.com/images/P/${product.asin}.01._SL500_.jpg` }
      : defaultProductImage;

  return (
    <Image
      source={src}
      style={styles.itemImage}
      resizeMode="cover"
      onError={() => setFallback(true)}
    />
  );
}

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, clearCart } = useCart();

  const amazonItems = cart.filter(p => !!getProductAsin(p));
  const webItems = cart.filter(p => !getProductAsin(p) && (p.link || p.amazonLink));

  const handleComprar = () => {
    const cartUrl = buildCartUrl(amazonItems);
    if (cartUrl) Linking.openURL(cartUrl);
    webItems.forEach(p => {
      const url = p.link || p.amazonLink;
      if (url) Linking.openURL(url);
    });
  };

  const comprarLabel = () => {
    const parts = [];
    if (amazonItems.length > 0) parts.push(`${amazonItems.length} en Amazon`);
    if (webItems.length > 0) parts.push(`${webItems.length} en web`);
    return `Comprar ${parts.join(' + ')}`;
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Header */}
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
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mi Carrito</Text>
            {cart.length > 0 && (
              <Text style={styles.headerSub}>
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </Text>
            )}
          </View>

          {cart.length > 0 ? (
            <TouchableOpacity onPress={clearCart} style={styles.headerBtn} activeOpacity={0.7}>
              <Text style={styles.clearText}>Vaciar</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </LinearGradient>

      {/* Empty state */}
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bag-outline" size={54} color="#E8C8D8" />
          </View>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySub}>
            Agrega productos desde la sección de recomendados
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.emptyBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBtnText}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 110 },
            ]}
          >
            {cart.map(product => {
              const isAmazon = !!getProductAsin(product);
              return (
                <View key={product.id} style={styles.cartItem}>
                  <CartItemImage product={product} />

                  <View style={styles.itemInfo}>
                    {product.brand ? (
                      <Text style={styles.itemBrand}>{product.brand}</Text>
                    ) : null}
                    <Text style={styles.itemName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.sourceTag}>
                      {isAmazon ? (
                        <>
                          <Ionicons name="logo-amazon" size={11} color="#FF9900" />
                          <Text style={[styles.sourceText, { color: '#FF9900' }]}>Amazon</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="globe-outline" size={11} color="#BF789C" />
                          <Text style={[styles.sourceText, { color: '#BF789C' }]}>Sitio web</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeFromCart(product.id)}
                    style={styles.removeBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar producto del carrito"
                  >
                    <Ionicons name="trash-outline" size={18} color="#D6A4A4" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              onPress={handleComprar}
              activeOpacity={0.88}
              style={styles.comprarBtn}
            >
              <LinearGradient
                colors={['#D6A4A4', '#BF789C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.comprarGradient}
              >
                <Ionicons
                  name="logo-amazon"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.comprarText}>{comprarLabel()}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {amazonItems.length > 0 && (
              <Text style={styles.footerNote}>
                Se abrirá Amazon con todos los productos listos para pagar
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // header
  header: {
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  clearText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },

  // empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FBF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#F0D8E8',
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BF789C',
  },

  // list
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F7ECEE',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D6A4A4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 19,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 4,
    flexShrink: 0,
  },

  // footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FDF5F8',
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0E0E8',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  comprarBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  comprarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  comprarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#C0A0A8',
    marginTop: 10,
  },
});
