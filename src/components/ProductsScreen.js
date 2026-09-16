import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from '@react-navigation/native';
import { categoryOptions } from '../data/products';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProductsByProfile, fetchAllProducts, filterProducts } from "../firebase/products";
import { scoreProductForProfile, CATEGORY_KEY } from "../utils/productScoring";
import { getWeatherContext, getWeatherBoostTags } from "../services/weatherService";
import { useCart } from '../context/CartContext';
import { buildAmazonUrl } from '../utils/amazonUtils';

const defaultProductImage = require("../../assets/icon.png");

const getProductImage = (product) => {
  if (product.image) return { uri: product.image };
  if (product.asin) return { uri: `https://m.media-amazon.com/images/P/${product.asin}.01._SL500_.jpg` };
  return defaultProductImage;
};

const ALL_CATEGORIES = [...categoryOptions];

// ─── CategoryChip ─────────────────────────────────────────────────────────────

function CategoryChip({ option, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onPress(option.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[styles.chip, isSelected && styles.chipSelected]}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {option.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, onBuy, onAddToCart, inCart }) {
  const [fallback, setFallback] = React.useState(0);

  const imgSource = React.useMemo(() => {
    if (product.image && fallback === 0) return { uri: product.image };
    if (!product.asin || fallback >= 2) return defaultProductImage;
    if (fallback === 0) return { uri: `https://m.media-amazon.com/images/P/${product.asin}.01._SL500_.jpg` };
    return { uri: `https://images-na.ssl-images-amazon.com/images/P/${product.asin}.01.LZZZZZZZ.jpg` };
  }, [product.asin, product.image, fallback]);

  return (
    <View style={styles.productCard}>
      <View style={styles.productCardTop}>
        <Image
          source={imgSource}
          style={styles.productImage}
          resizeMode="cover"
          onError={() => setFallback(f => f + 1)}
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source;
            if (width <= 1 || height <= 1) setFallback(f => f + 1);
          }}
        />
        <View style={styles.productInfo}>
          {product.brand ? (
            <Text style={styles.productBrand}>{product.brand}</Text>
          ) : null}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={onAddToCart}
          activeOpacity={0.85}
          style={[styles.cartIconBtn, inCart && styles.cartIconBtnActive]}
          accessibilityRole="button"
          accessibilityLabel="Agregar al carrito"
          accessibilityState={{ selected: inCart }}
        >
          <Ionicons
            name={inCart ? 'bag-check' : 'bag-add-outline'}
            size={18}
            color={inCart ? '#fff' : '#BF789C'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBuy}
          activeOpacity={0.85}
          style={styles.buyButton}
        >
          <LinearGradient
            colors={["#D6A4A4", "#BF789C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyGradient}
          >
            <Ionicons name="logo-amazon" size={15} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buyText}>Comprar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductsScreen({ route, navigation, hideHeader }) {
  const routines = route?.params?.routines || [];
  const date     = route?.params?.date;
  const insets   = useSafeAreaInsets();

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
      })
    : "";

  const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0]?.id || "shampoo");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileProducts, setProfileProducts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [weatherBoostTags, setWeatherBoostTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart from context
  const { cart, toggleCart } = useCart();

  // Toast
  const [toastProduct, setToastProduct] = useState(null);
  const toastTranslateY = useRef(new Animated.Value(80)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef(null);

  const showToast = (product) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastProduct(product);
    toastTranslateY.setValue(80);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(toastTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 22,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastProduct(null));
    }, 2200);
  };

  const handleToggleCart = (product) => {
    const isInCart = !!cart.find(p => p.id === product.id);
    toggleCart(product);
    if (!isInCart) showToast(product);
  };

  const loadProfileProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem("@mybeauty-calendar:hairProfile");

      let data = [];
      let profile = null;

      if (raw) {
        profile = JSON.parse(raw);
        const flags = Object.entries(profile)
          .filter(([, v]) => v === true)
          .map(([k]) => k);

        if (flags.length > 0) {
          data = await fetchProductsByProfile(flags);
          if (data.length === 0) {
            data = await fetchAllProducts();
          }
        } else {
          data = await fetchAllProducts();
        }
      } else {
        data = await fetchAllProducts();
      }

      if (data.length > 0) {
        const availableCategories = Array.from(new Set(data.map((p) => p.category))).filter(Boolean);
        if (availableCategories.length > 0) {
          const defaultCategory = ALL_CATEGORIES.find((option) => availableCategories.includes(option.title));
          setSelectedCategory(defaultCategory ? defaultCategory.id : ALL_CATEGORIES[0]?.id || "shampoo");
        }
      }

      setUserProfile(profile);
      setProfileProducts(data);
    } catch (error) {
      console.error("❌ [ProductsScreen] Error loading products:", error);
      setProfileProducts([]);
    }

    try {
      const weatherCtx = await getWeatherContext();
      if (weatherCtx?.flags?.length) setWeatherBoostTags(getWeatherBoostTags(weatherCtx.flags));
    } catch {}

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileProducts();
    }, [loadProfileProducts])
  );

  const CATEGORY_MAP = {
    shampoo: "Shampoo",
    acondicionador: "Acondicionador",
    tratamiento: "Tratamiento",
    cremaDePeinar: "Crema de Peinar",
    gel: "Gel",
    espumas: "Espumas",
    aceites: "Aceites",
    tonico: "Tónico",
    accesorios: "Accesorios",
  };

  function scoreProduct(product, profile, boostTags) {
    let score = profile
      ? scoreProductForProfile(product, CATEGORY_KEY[product.category] || product.category, profile)
      : 0;
    if (product.tags && boostTags.length > 0)
      score += product.tags.filter(t => boostTags.some(bt => t.toLowerCase().includes(bt))).length * 0.5;
    return score;
  }

  function getGroupedByBrand(products, profile, boostTags) {
    const byBrand = {};
    products.forEach(p => {
      if (!byBrand[p.brand]) byBrand[p.brand] = [];
      byBrand[p.brand].push({ ...p, _score: scoreProduct(p, profile, boostTags) });
    });
    return Object.entries(byBrand)
      .map(([brand, prods]) => ({
        brand,
        products: prods.sort((a, b) => b._score - a._score).slice(0, 2),
      }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }

  const categoryFiltered = selectedCategory
    ? profileProducts.filter(p => p.category === CATEGORY_MAP[selectedCategory])
    : profileProducts;

  const searched = filterProducts(categoryFiltered, searchQuery);
  const brandGroups = getGroupedByBrand(searched, userProfile, weatherBoostTags);

  const openLink = async (url) => {
    try {
      if (!url) {
        alert("Aún no tenemos un enlace directo de Amazon para este producto.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      alert("No se puede abrir el enlace.");
    }
  };

  const openAmazon = (product) => openLink(buildAmazonUrl(product));

  const getProductsForRoutine = () => {
    const seen = new Set();
    const products = [];
    routines.forEach((item) => {
      const p = item?.product;
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        products.push(p);
      }
    });
    return products;
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── GRADIENT HEADER ── */}
      {!hideHeader && (
        <LinearGradient
          colors={["#DEB4CC", "#BF789C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerRow}>
            {navigation.canGoBack() ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
            ) : <View style={{ width: 36 }} />}

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Mis Productos</Text>
              {formattedDate ? (
                <Text style={styles.headerSub}>{formattedDate}</Text>
              ) : null}
            </View>

            {/* Cart icon → CartScreen */}
            <TouchableOpacity
              style={styles.cartHeaderBtn}
              onPress={() => navigation.navigate('Cart')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ver carrito"
            >
              <Ionicons name="bag-outline" size={20} color="#fff" />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.75)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar productos..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
              selectionColor="rgba(255,255,255,0.6)"
              cursorColor="#fff"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
              >
                <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── RUTINA DEL DÍA ── */}
        {getProductsForRoutine().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={13} color="#D6A4A4" />
              <Text style={styles.sectionTitle}>Tu rutina de hoy</Text>
            </View>
            {getProductsForRoutine().map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={() => openAmazon(product)}
                onAddToCart={() => handleToggleCart(product)}
                inCart={!!cart.find(p => p.id === product.id)}
              />
            ))}
          </View>
        )}

        {/* ── CATEGORÍAS ── */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="grid-outline" size={13} color="#D6A4A4" />
          <Text style={styles.sectionTitle}>Categorías</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={{ marginBottom: 24 }}
        >
          {ALL_CATEGORIES.map((option) => (
            <CategoryChip
              key={option.id}
              option={option}
              isSelected={selectedCategory === option.id}
              onPress={setSelectedCategory}
            />
          ))}
        </ScrollView>

        {/* ── PRODUCTOS ── */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bag-handle-outline" size={13} color="#D6A4A4" />
          <Text style={styles.sectionTitle}>Recomendados para ti</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#D6A4A4" style={{ marginTop: 32 }} />
        ) : brandGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🪄</Text>
            <Text style={styles.emptyText}>
              No hay productos compatibles con tu diagnóstico en esta categoría.
            </Text>
          </View>
        ) : (
          brandGroups.map(({ brand, products: brandProds }) => (
            <View key={brand} style={{ marginBottom: 8 }}>
              <Text style={styles.brandHeader}>{brand}</Text>
              {brandProds.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={() => openAmazon(product)}
                  onAddToCart={() => handleToggleCart(product)}
                  inCart={!!cart.find(p => p.id === product.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── TOAST "Agregado al carrito" ── */}
      {toastProduct && (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom: insets.bottom + 20,
              transform: [{ translateY: toastTranslateY }],
              opacity: toastOpacity,
            },
          ]}
        >
          <Image source={getProductImage(toastProduct)} style={styles.toastImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toastProductName} numberOfLines={1}>
              {toastProduct.brand ? `${toastProduct.brand} · ` : ''}{toastProduct.name}
            </Text>
            <View style={styles.toastRow}>
              <Ionicons name="checkmark-circle" size={13} color="#7ADA7A" />
              <Text style={styles.toastLabel}>Agregado al carrito</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
              setToastProduct(null);
              navigation.navigate('Cart');
            }}
            style={styles.toastViewBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.toastViewText}>Ver</Text>
            <Ionicons name="chevron-forward" size={13} color="#BF789C" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FDF5F8",
  },

  // header
  header: {
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#BF789C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "capitalize",
  },

  // scroll
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 48,
  },

  // sections
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D6A4A4",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // chips
  chipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EDD8DC",
    shadowColor: "#C47898",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: "#D6A4A4",
    borderColor: "#D6A4A4",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  chipTextSelected: {
    color: "#fff",
  },

  brandHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#BF789C",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 8,
  },

  // product cards
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#BF789C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  productCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productImage: {
    width: 88,
    height: 88,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: "#F7ECEE",
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D6A4A4",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2D2D",
    marginBottom: 6,
    lineHeight: 21,
  },
  productDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 19,
  },

  // card actions
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cartIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F0D8E8',
  },
  cartIconBtnActive: {
    backgroundColor: '#BF789C',
    borderColor: '#BF789C',
  },
  buyButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 52,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#BBB",
    textAlign: "center",
    lineHeight: 22,
  },

  // header cart icon
  cartHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BF789C',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  // toast
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  toastImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F7ECEE',
    flexShrink: 0,
  },
  toastProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  toastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toastLabel: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
  },
  toastViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingLeft: 8,
    flexShrink: 0,
  },
  toastViewText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BF789C',
  },
});
