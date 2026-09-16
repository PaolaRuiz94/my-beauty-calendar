import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { buildCartUrl, getProductAsin } from '../utils/amazonUtils';
import { fetchStoreInfo } from '../firebase/stores';
import { buildWhatsAppUrl, buildOrderMessage } from '../utils/storeContact';
import { buildAddToCartUrl, buildCartPageUrl } from '../utils/wooCommerceCart';

const defaultProductImage = require('../../assets/icon.png');

const formatCOP = (value) => `$${value.toLocaleString('es-CO')} COP`;

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
  const { cart, removeFromCart, clearCart, setQuantity } = useCart();

  const amazonItems = cart.filter(p => !!getProductAsin(p));
  const webItems = cart.filter(p => !getProductAsin(p) && (p.link || p.amazonLink));
  const storeItemsByStoreId = useMemo(() => {
    const groups = {};
    cart.forEach((p) => {
      if (getProductAsin(p) || p.link || p.amazonLink || !p.storeId) return;
      (groups[p.storeId] = groups[p.storeId] || []).push(p);
    });
    return groups;
  }, [cart]);
  const storeIds = Object.keys(storeItemsByStoreId);

  const [storeInfoById, setStoreInfoById] = useState({});
  useEffect(() => {
    const missing = storeIds.filter((id) => !storeInfoById[id]);
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => fetchStoreInfo(id).then((info) => [id, info]).catch(() => [id, null])))
      .then((pairs) => {
        setStoreInfoById((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, info]) => { next[id] = info; });
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeIds.join(',')]);

  // Por tienda: qué productos van al carrito real (WooCommerce, necesita
  // sitio web + externalProductId) y cuáles van por WhatsApp (el resto).
  const splitStoreItems = (storeId) => {
    const items = storeItemsByStoreId[storeId] || [];
    const info = storeInfoById[storeId];
    const withId = info?.website ? items.filter(p => p.externalProductId) : [];
    const withoutId = items.filter(p => !withId.includes(p));
    return { withId, withoutId, info };
  };

  const handleComprar = () => {
    const cartUrl = buildCartUrl(amazonItems);
    if (cartUrl) Linking.openURL(cartUrl);
    webItems.forEach(p => {
      const url = p.link || p.amazonLink;
      if (url) Linking.openURL(url);
    });
    storeIds.forEach((storeId) => {
      const { withId, withoutId, info } = splitStoreItems(storeId);

      if (withId.length > 0) {
        const urls = withId.map(p => buildAddToCartUrl(info.website, p.externalProductId, p.quantity || 1)).filter(Boolean);
        navigation.navigate('StoreCheckout', {
          addToCartUrls: urls,
          cartUrl: buildCartPageUrl(info.website),
          storeName: info.nombre,
        });
      }

      if (withoutId.length > 0) {
        const waUrl = info?.telefono ? buildWhatsAppUrl(info.telefono, buildOrderMessage(info?.nombre || 'la tienda', withoutId)) : null;
        if (waUrl) {
          Linking.openURL(waUrl);
        } else {
          Alert.alert(
            info?.nombre || 'Tienda',
            'Esta tienda todavía no tiene un teléfono cargado. Contactala directamente para comprar estos productos.'
          );
        }
      }
    });
  };

  const comprarLabel = () => {
    const parts = [];
    if (amazonItems.length > 0) parts.push(`${amazonItems.length} en Amazon`);
    if (webItems.length > 0) parts.push(`${webItems.length} en web`);
    let cartCount = 0;
    let waCount = 0;
    storeIds.forEach((id) => {
      const { withId, withoutId } = splitStoreItems(id);
      cartCount += withId.length;
      waCount += withoutId.length;
    });
    if (cartCount > 0) parts.push(`${cartCount} en tienda`);
    if (waCount > 0) parts.push(`${waCount} por WhatsApp`);
    return `Comprar ${parts.join(' + ')}`;
  };

  const totalUnits = cart.reduce((sum, p) => sum + (p.quantity || 1), 0);
  const pricedSubtotal = cart.reduce(
    (sum, p) => sum + (typeof p.price === 'number' ? p.price * (p.quantity || 1) : 0),
    0
  );

  let storeCartCount = 0;
  let storeWaCount = 0;
  storeIds.forEach((id) => {
    const { withId, withoutId } = splitStoreItems(id);
    storeCartCount += withId.length;
    storeWaCount += withoutId.length;
  });

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
                {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
                {totalUnits !== cart.length ? ` · ${cart.length} ${cart.length === 1 ? 'producto' : 'productos'}` : ''}
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
              const isStore = !isAmazon && !!product.storeId;
              const storeInfo = isStore ? storeInfoById[product.storeId] : null;
              const storeName = storeInfo?.nombre || 'Tienda';
              const hasStoreCart = isStore && !!storeInfo?.website && !!product.externalProductId;
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
                    {typeof product.price === 'number' && (
                      <Text style={styles.itemPrice}>{formatCOP(product.price)}</Text>
                    )}
                    <View style={styles.sourceTag}>
                      {isAmazon ? (
                        <>
                          <Ionicons name="logo-amazon" size={11} color="#FF9900" />
                          <Text style={[styles.sourceText, { color: '#FF9900' }]}>Amazon</Text>
                        </>
                      ) : isStore ? (
                        <>
                          <Ionicons
                            name={hasStoreCart ? 'bag-handle-outline' : 'logo-whatsapp'}
                            size={11}
                            color={hasStoreCart ? '#BF789C' : '#25D366'}
                          />
                          <Text style={[styles.sourceText, { color: hasStoreCart ? '#BF789C' : '#25D366' }]} numberOfLines={1}>{storeName}</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="globe-outline" size={11} color="#BF789C" />
                          <Text style={[styles.sourceText, { color: '#BF789C' }]}>Sitio web</Text>
                        </>
                      )}
                    </View>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        onPress={() => setQuantity(product.id, (product.quantity || 1) - 1)}
                        style={styles.qtyBtn}
                        activeOpacity={0.7}
                        disabled={(product.quantity || 1) <= 1}
                        accessibilityRole="button"
                        accessibilityLabel="Restar una unidad"
                      >
                        <Ionicons name="remove" size={14} color={(product.quantity || 1) <= 1 ? '#DDD' : '#BF789C'} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{product.quantity || 1}</Text>
                      <TouchableOpacity
                        onPress={() => setQuantity(product.id, (product.quantity || 1) + 1)}
                        style={styles.qtyBtn}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Sumar una unidad"
                      >
                        <Ionicons name="add" size={14} color="#BF789C" />
                      </TouchableOpacity>
                      {typeof product.price === 'number' && (product.quantity || 1) > 1 && (
                        <Text style={styles.itemSubtotal}>{formatCOP(product.price * (product.quantity || 1))}</Text>
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
            {pricedSubtotal > 0 && (
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Subtotal con precio cargado</Text>
                <Text style={styles.subtotalValue}>{formatCOP(pricedSubtotal)}</Text>
              </View>
            )}
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
                  name={amazonItems.length > 0 ? 'logo-amazon' : storeCartCount > 0 ? 'bag-handle-outline' : storeWaCount > 0 ? 'logo-whatsapp' : 'bag-check-outline'}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.comprarText}>{comprarLabel()}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {(amazonItems.length > 0 || storeCartCount > 0 || storeWaCount > 0) && (
              <Text style={styles.footerNote}>
                {[
                  amazonItems.length > 0 && 'Amazon',
                  storeCartCount > 0 && 'el carrito de la tienda',
                  storeWaCount > 0 && 'WhatsApp',
                ].filter(Boolean).join(' y ')}
                {' '}se abrirá para completar tu compra
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
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BF789C',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginLeft: 'auto',
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
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FBF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
    minWidth: 18,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
    flexShrink: 0,
  },

  // footer
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtotalLabel: {
    fontSize: 13,
    color: '#999',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
  },
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
