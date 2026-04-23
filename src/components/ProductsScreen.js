import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { categoryOptions, productDB } from "../data/productDB";

const defaultProductImage = require("../../assets/icon.png");

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

function ProductCard({ product, onBuy }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productCardTop}>
        <Image
          source={product.image ? { uri: product.image } : defaultProductImage}
          style={styles.productImage}
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
          <Ionicons name="bag-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.buyText}>Comprar</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductsScreen({ route, navigation }) {
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

  const getVisibleProducts = () => {
    if (selectedCategory === "all") return Object.values(productDB).flat();
    return productDB[selectedCategory] || [];
  };

  const products = getVisibleProducts();

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      alert("No se puede abrir el enlace.");
    }
  };

  const getProductsForRoutine = () => routines;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── GRADIENT HEADER ── */}
      <LinearGradient
        colors={["#DEB4CC", "#BF789C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mis Productos</Text>
            {formattedDate ? (
              <Text style={styles.headerSub}>{formattedDate}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
            <View style={styles.routineCard}>
              {getProductsForRoutine().map((item, index) => (
                <View key={index} style={styles.routineItem}>
                  <View style={styles.routineDot} />
                  <Text style={styles.routineText}>{item?.text || ""}</Text>
                </View>
              ))}
            </View>
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
          <Text style={styles.sectionTitle}>
            {products.length} producto{products.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🪄</Text>
            <Text style={styles.emptyText}>
              Selecciona una categoría para ver productos.
            </Text>
          </View>
        ) : (
          products.map((product, index) => (
            <ProductCard
              key={product.id || index}
              product={product}
              onBuy={() => openLink(product.link)}
            />
          ))
        )}
      </ScrollView>
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

  // rutina del día
  routineCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#C47898",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  routineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D6A4A4",
    marginTop: 6,
    flexShrink: 0,
  },
  routineText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 21,
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
    resizeMode: "cover",
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
  buyButton: {
    borderRadius: 14,
    overflow: "hidden",
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
});
