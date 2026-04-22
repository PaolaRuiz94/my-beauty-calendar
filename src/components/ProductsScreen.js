import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import AppHeader from "./AppHeader";
import { categoryOptions, productDB } from "../data/productDB";

const defaultProductImage = require("../../assets/icon.png");

export default function ProductsScreen({ route, navigation }) {
  const routines = route?.params?.routines || [];

  const date = route?.params?.date;

const formattedDate = date
  ? new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    })
  : '';
   const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getVisibleProducts = () => {
    if (selectedCategory === "all") {
      return Object.values(productDB).flat();
    }
    return productDB[selectedCategory] || [];
  };

  const products = getVisibleProducts();

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      alert("No se puede abrir el enlace.");
    }
  };

  const getProductsForRoutine = () => {
  return routines;
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader />
      <Text style={styles.subtitle}>
        Selecciona una categoría para ver productos capilares reales de Almacén Sandra: shampoo, tratamiento, acondicionador, crema de peinar, gel, espuma y aceite.
      </Text>

      {/* 🔥 Productos según rutina del día */}
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>
        Productos recomendados para tu rutina de hoy {formattedDate}
      </Text>

  <View style={{ marginBottom: 20 }}>
    {getProductsForRoutine().length === 0 ? (
      <Text style={styles.emptyText}>
        No hay productos asociados a la rutina de hoy.
      </Text>
    ) : (
      getProductsForRoutine().map((item, index) => (
        <Text key={index} style={{ marginBottom: 5 }}>
          • {item}
        </Text>
      ))
    )}
  </View>

        <View style={styles.filterRow}>
          {categoryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.filterButton, selectedCategory === option.id && styles.filterButtonSelected]}
              onPress={() => setSelectedCategory(option.id)}
            >
              <Text
                style={[styles.filterText, selectedCategory === option.id && styles.filterTextSelected]}
              >
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {products.length === 0 ? (
          <Text style={styles.emptyText}>
            Selecciona una categoría para ver productos recomendados.
          </Text>
        ) : (
          products.map((product, index) => (
            <View key={index} style={styles.productCard}>
              <View style={styles.productCardTop}>
                <Image
                  source={product.image ? { uri: product.image } : defaultProductImage}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>{product.description}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => openLink(product.link)}
              >
                <Text style={styles.buyText}>Comprar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 20,
      backgroundColor: "#FAF8F6",
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#C48A95",
      flex: 1,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 20,
    },
    filterButton: {
      backgroundColor: "#F7ECEE",
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 14,
      margin: 4,
      borderWidth: 1,
      borderColor: "#EAD7DB",
    },
    filterButtonSelected: {
      backgroundColor: "#D6A4A4",
      borderColor: "#D6A4A4",
    },
    filterText: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
    filterTextSelected: {
      color: colors.white,
    },
    productCard: {
      backgroundColor: "#ffffff",
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: "#F0E6E8",
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    productCardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 14,
    },
    productImage: {
      width: 96,
      height: 96,
      borderRadius: 16,
      marginRight: 14,
      backgroundColor: "#F7ECEE",
      resizeMode: "cover",
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 6,
      color: colors.textPrimary,
    },
    productDescription: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    buyButton: {
      backgroundColor: "#D6A4A4",
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: "center",
    },
    buyText: {
      color: colors.white,
      fontWeight: "700",
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
    },
  });

