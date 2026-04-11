import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const categories = [
  {
    title: 'Para rizadas',
    image:
      'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  {
    title: 'Para lisas',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  {
    title: 'Transición capilar',
    image:
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  {
    title: 'Skincare',
    image:
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  {
    title: 'Mejores peluquerías',
    image:
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  {
    title: 'Colorimetría',
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
];

const CARD_WIDTH = 170;
const CARD_HEIGHT = 220;
const SCREEN_PADDING = 20;

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Recomendaciones capilares</Text>

        {categories.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {section.data.map((item) => (
                <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.85}>
                  <ImageBackground
                    source={{ uri: section.image }}
                    style={styles.cardBackground}
                    imageStyle={styles.cardImage}
                  >
                    <View style={styles.cardContent}>
                      <Text style={styles.cardLabel}>Consejo {item.id}</Text>
                      <Text style={styles.cardText} numberOfLines={2}>
                        Tips para mejorar tu rutina y cuidar tu cabello con calma.
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingTop: 24,
      paddingBottom: 40,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 18,
      paddingHorizontal: SCREEN_PADDING,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 14,
      paddingHorizontal: SCREEN_PADDING,
    },
    carousel: {
      paddingLeft: SCREEN_PADDING,
    },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 24,
      marginRight: 18,
      backgroundColor: colors.surface,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
      overflow: 'hidden',
    },
    cardBackground: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    cardImage: {
      borderRadius: 24,
    },
    cardContent: {
      flex: 1,
      padding: 18,
      justifyContent: 'space-between',
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
      marginBottom: 6,
    },
    cardText: {
      fontSize: 13,
      color: colors.white,
      lineHeight: 19,
    },
  });
