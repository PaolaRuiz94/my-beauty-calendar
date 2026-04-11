import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';

const defaultProductImage = require('../../assets/icon.png');

const categoryOptions = [
  { id: 'all', title: 'Todos' },
  { id: 'preshampoo', title: 'Preshampoo' },
  { id: 'shampoo', title: 'Shampoo' },
  { id: 'tratamiento', title: 'Tratamiento' },
  { id: 'acondicionador', title: 'Acondicionador' },
  { id: 'termoprotector', title: 'Termoprotector' },
  { id: 'crema_peinar', title: 'Crema de peinar' },
  { id: 'geles', title: 'Geles' },
  { id: 'espumas', title: 'Espumas' },
  { id: 'aceites', title: 'Aceites' },
];

const productDB = {
  preshampoo: [
    {
      name: 'Kérastase Specifique Bain Pré-Shampoo',
      description: 'Limpieza profunda previa al lavado para un cuero cabelludo equilibrado.',
      link: 'https://www.amazon.com.mx/s?k=Kerastase+Specifique+Bain+Pre-Shampoo',
      image: defaultProductImage,
    },
  ],
  shampoo: [
    {
      name: 'Shampoo Kérastase Discipline',
      description: 'Suaviza el cabello rebelde y controla el frizz desde el lavado.',
      link: 'https://www.amazon.com.mx/s?k=Kerastase+Discipline+Shampoo',
      image: defaultProductImage,
    },
  ],
  tratamiento: [
    {
      name: 'Mascarilla hidratante Shea Moisture Raw Shea Butter',
      description: 'Hidratación profunda para puntas secas y cabello dañado.',
      link: 'https://www.amazon.com.mx/s?k=Shea+Moisture+Raw+Shea+Butter+Hair+Mask',
      image: defaultProductImage,
    },
  ],
  acondicionador: [
    {
      name: 'Acondicionador L’Oréal Elvive Dream Lengths',
      description: 'Suaviza y fortalece el cabello largo sin apelmazarlo.',
      link: 'https://www.amazon.com.mx/s?k=LOreal+Elvive+Dream+Lengths+Conditioner',
      image: defaultProductImage,
    },
  ],
  termoprotector: [
    {
      name: 'Termoprotector TRESemmé Thermal Creations',
      description: 'Protege el cabello del calor de planchas y secadores.',
      link: 'https://www.amazon.com.mx/s?k=TRESemme+Thermal+Creations',
      image: defaultProductImage,
    },
  ],
  crema_peinar: [
    {
      name: 'Crema de peinar Garnier Fructis',
      description: 'Define ondas y controla el frizz sin dejar el cabello pesado.',
      link: 'https://www.amazon.com.mx/s?k=Garnier+Fructis+Crema+de+Peinar',
      image: defaultProductImage,
    },
  ],
  geles: [
    {
      name: 'Gel capilar Eco Styler',
      description: 'Fijación fuerte con brillo sin residuos secos.',
      link: 'https://www.amazon.com.mx/s?k=Eco+Styler+Gel',
      image: defaultProductImage,
    },
  ],
  espumas: [
    {
      name: 'Espuma reductora de frizz John Frieda',
      description: 'Controla volumen y humedad sin dejar el cabello rígido.',
      link: 'https://www.amazon.com.mx/s?k=John+Frieda+Frizz+Ease+Mousse',
      image: defaultProductImage,
    },
  ],
  aceites: [
    {
      name: 'Aceite de argán Moroccanoil',
      description: 'Nutre, aporta brillo y suaviza puntas secas.',
      link: 'https://www.amazon.com.mx/s?k=Moroccanoil+Argan+Oil',
      image: defaultProductImage,
    },
  ],
};

export default function ProductsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [remoteProductImages, setRemoteProductImages] = useState({});
  const [fetchErrors, setFetchErrors] = useState({});

  const getVisibleProducts = () => {
    if (selectedCategory === 'all') {
      return Object.values(productDB).flat();
    }
    return productDB[selectedCategory] || [];
  };

  const products = getVisibleProducts();

  useEffect(() => {
    const getProxyUrl = (link) => {
      const trimmed = link.replace(/^https?:\/\//, '');
      return `https://r.jina.ai/http://${trimmed}`;
    };

    const parseAmazonImage = (text) => {
      const rawMatches = [...text.matchAll(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
      if (rawMatches.length === 0) {
        return null;
      }

      const normalizeUrl = (url) => {
        if (url.startsWith('http://')) {
          return url.replace(/^http:\/\//, 'https://');
        }
        return url;
      };

      const normalized = rawMatches.map(normalizeUrl);

      const preferred = normalized.find(
        (url) =>
          url.includes('m.media-amazon.com/images/I/') ||
          url.includes('m.media-amazon.com/images/S/') ||
          url.includes('amazon.com.mx/images')
      );
      if (preferred) {
        return preferred;
      }

      const fallback = normalized.find(
        (url) =>
          url.includes('m.media-amazon.com/images') ||
          url.includes('fls-na.amazon.com.mx') ||
          url.includes('aax-us-east-retail-direct.amazon.com')
      );
      return fallback || normalized[0];
    };

    const fetchImageForLink = async (link) => {
      try {
        const response = await fetch(getProxyUrl(link));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body = await response.text();
        const imageUrl = parseAmazonImage(body);

        if (imageUrl) {
          setRemoteProductImages((prev) => ({ ...prev, [link]: imageUrl }));
        } else {
          setFetchErrors((prev) => ({ ...prev, [link]: true }));
        }
      } catch (error) {
        setFetchErrors((prev) => ({ ...prev, [link]: true }));
      }
    };

    products.forEach((product) => {
      if (
        product.link &&
        !remoteProductImages[product.link] &&
        !fetchErrors[product.link]
      ) {
        fetchImageForLink(product.link);
      }
    });
  }, [products, remoteProductImages, fetchErrors]);

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      alert('No se puede abrir el enlace.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Productos recomendados</Text>
      <Text style={styles.subtitle}>
        Selecciona la categoría y encuentra productos reales con opción de compra.
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
                source={
                  remoteProductImages[product.link]
                    ? { uri: remoteProductImages[product.link] }
                    : product.image || defaultProductImage
                }
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5DC',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
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
    backgroundColor: '#FFF7E8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0D9BF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 4,
  },
  filterButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#C49A24',
  },
  filterText: {
    color: '#333',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#fff',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D9BF',
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
    backgroundColor: '#F0E6D6',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 15,
    color: '#555',
  },
  buyButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  buyText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
