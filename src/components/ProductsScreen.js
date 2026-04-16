import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';

const defaultProductImage = require('../../assets/icon.png');

const categoryOptions = [
  { id: 'all', title: 'Todos' },
  { id: 'shampoo', title: 'Shampoo' },
  { id: 'tratamiento', title: 'Tratamiento' },
  { id: 'acondicionador', title: 'Acondicionador' },
  { id: 'cremaDePeinar', title: 'Crema de peinar' },
  { id: 'gel', title: 'Gel' },
  { id: 'espuma', title: 'Espuma' },
  { id: 'aceite', title: 'Aceite' },
];

const productDB = {
  shampoo: [
    {
      name: 'KATIVA SHAMPOO ARGAN X 1000ML',
      description:
        'Shampoo nutritivo con argán para mantener el cabello suave, brillante y con limpieza equilibrada.',
      link: 'https://almacensandra.com.co/product/p-10437-kativa-shampoo-argan-x-1000ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy8xMDQzNy83NDUxNS5qcGciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjgwMCwiaGVpZ2h0Ijo5NjB9LCJ0b0Zvcm1hdCI6IndlYnAifX0=',
    },
  ],
  tratamiento: [
    {
      name: 'KERASTASE GLOSS ABSOLU MASQUE HYDRA-GLAZE X 200ML',
      description:
        'Mascarilla de tratamiento profunda para restaurar la fibra capilar y retener la hidratación.',
      link: 'https://almacensandra.com.co/product/p-49862-kerastase-gloss-absolu-masque-hydra-glaze-x-200ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJzdGF0aWMvcHJvZHVjdHNHYWxsZXJ5LzdjYjI5NTAyLTU4M2YtNDJmZC04ZDY0LWI5YWRhZjMyMDA5Ml8xMDI0NjguanBnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjo4MDAsImhlaWdodCI6OTYwfSwidG9Gb3JtYXQiOiJ3ZWJwIn19',
    },
  ],
  acondicionador: [
    {
      name: 'KATIVA ACONDICIONADOR ARGAN X 500ML',
      description:
        'Acondicionador hidratante con aceite de argán para desenredar y proteger la fibra.',
      link: 'https://almacensandra.com.co/product/p-3654-kativa-acondicionador-argan-x-500ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy8zNjU0LzQwNjUyLmpwZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6ODAwLCJoZWlnaHQiOjk2MH0sInRvRm9ybWF0Ijoid2VicCJ9fQ==',
    },
  ],
  cremaDePeinar: [
    {
      name: 'SALERM CREMA DE PEINAR SALERM 21 X 200GR',
      description:
        'Crema para peinar que ayuda a definir y proteger sin dejar peso en el cabello.',
      link: 'https://almacensandra.com.co/product/p-702-salerm-crema-de-peinar-salerm-21-x-200gr',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy83MDIvMTI0MDcuanBnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjo4MDAsImhlaWdodCI6OTYwfSwidG9Gb3JtYXQiOiJ3ZWJwIn19',
    },
  ],
  gel: [
    {
      name: 'GEL MAXIMA FIJACION X 200 ML',
      description:
        'Gel de fijación para mantener el estilo y el control en peinados definidos.',
      link: 'https://almacensandra.com.co/product/p-13984-gel-maxima-fijacion-x-200-ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy8xMzk4NC84MTcxNS5qcGciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjgwMCwiaGVpZ2h0Ijo5NjB9LCJ0b0Zvcm1hdCI6IndlYnAifX0=',
    },
  ],
  espuma: [
    {
      name: 'YUMA ESPUMA CAPILAR HIDRATANTE CREADOR DE RIZOS X 200ML',
      description:
        'Espuma capilar que define los rizos con hidratación y control sin apelmazar.',
      link: 'https://almacensandra.com.co/product/p-40082-yuma-espuma-capilar-hidratante-creador-de-rizos-x-200ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy80MDA4Mi85NDkxMS5qcGciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjgwMCwiaGVpZ2h0Ijo5NjB9LCJ0b0Zvcm1hdCI6IndlYnAifX0=',
    },
  ],
  aceite: [
    {
      name: 'ATHOS ACEITE DE COCO X 1000 ML',
      description:
        'Aceite de coco puro para nutrir puntas, sellar la fibra y aportar brillo natural.',
      link: 'https://almacensandra.com.co/product/p-2833-athos-aceite-de-coco-x-1000-ml',
      image:
        'https://d2k4simfy5dbs2.cloudfront.net/eyJidWNrZXQiOiJjYXNhbmRyYS1zdGF0aWMiLCJrZXkiOiJwcm9kdWN0cy8yODMzLzMyMDc4LmpwZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6ODAwLCJoZWlnaHQiOjk2MH0sInRvRm9ybWF0Ijoid2VicCJ9fQ==',
    },
  ],
};

export default function ProductsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getVisibleProducts = () => {
    if (selectedCategory === 'all') {
      return Object.values(productDB).flat();
    }
    return productDB[selectedCategory] || [];
  };

  const products = getVisibleProducts();

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      alert('No se puede abrir el enlace.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader />
      <Text style={styles.subtitle}>
        Selecciona una categoría para ver productos capilares reales de Almacén Sandra: shampoo, tratamiento, acondicionador, crema de peinar, gel, espuma y aceite.
      </Text>

      <View style={styles.filterRow}>
        {categoryOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterButton,
              selectedCategory === option.id && styles.filterButtonSelected,
            ]}
            onPress={() => setSelectedCategory(option.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === option.id && styles.filterTextSelected,
              ]}
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
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 20,
      backgroundColor: '#FAF8F6',
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#C48A95',
      flex: 1,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 20,
    },
    filterButton: {
      backgroundColor: '#F7ECEE',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 14,
      margin: 4,
      borderWidth: 1,
      borderColor: '#EAD7DB',
    },
    filterButtonSelected: {
      backgroundColor: '#D6A4A4',
      borderColor: '#D6A4A4',
    },
    filterText: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    filterTextSelected: {
      color: colors.white,
    },
    productCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: '#F0E6E8',
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    productCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    productImage: {
      width: 96,
      height: 96,
      borderRadius: 16,
      marginRight: 14,
      backgroundColor: '#F7ECEE',
      resizeMode: 'cover',
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 6,
      color: colors.textPrimary,
    },
    productDescription: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    buyButton: {
      backgroundColor: '#D6A4A4',
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    buyText: {
      color: colors.white,
      fontWeight: '700',
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
    },
  });

