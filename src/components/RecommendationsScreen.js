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
import AppHeader from './AppHeader';

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
const FEATURED_HEIGHT = 260;
const SCREEN_PADDING = 20;

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />

        {categories.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.featuredWrapper}>
              <View style={[styles.featuredBackground, index % 2 === 0 && styles.featuredBackgroundAlt]} />
              <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
                <ImageBackground
                  source={{ uri: section.image }}
                  style={styles.featuredImage}
                  imageStyle={styles.featuredImageStyle}
                >
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredPreTitle}>Destacado</Text>
                    <Text style={styles.featuredTitle}>{section.title}</Text>
                    <Text style={styles.featuredSubtitle} numberOfLines={2}>
                      Descubre consejos editoriales y rutinas premium para tu tipo de cabello.
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            <View style={styles.splitRow} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {section.data.map((item) => (
                <TouchableOpacity key={item.id} style={styles.smallCard} activeOpacity={0.85}>
                  <Text style={styles.smallCardTag}>Consejo {item.id}</Text>
                  <Text style={styles.smallCardLabel}>Rutina suave</Text>
                  <Text style={styles.smallCardText} numberOfLines={3}>
                    Inspiración liviana para mantener tu cabello sano y con brillo editorial.
                  </Text>
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
      paddingTop: 0,
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
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 18,
      paddingHorizontal: SCREEN_PADDING,
    },
    featuredWrapper: {
      paddingHorizontal: SCREEN_PADDING,
      marginBottom: 16,
    },
    featuredBackground: {
      position: 'absolute',
      top: 10,
      left: 0,
      right: 0,
      height: FEATURED_HEIGHT,
      borderRadius: 40,
      backgroundColor: colors.softWhite,
      transform: [{ scaleX: 1.05 }],
    },
    featuredBackgroundAlt: {
      backgroundColor: colors.surface,
    },
    featuredCard: {
      height: FEATURED_HEIGHT,
      borderRadius: 32,
      overflow: 'hidden',
      backgroundColor: colors.card,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: 5,
    },
    featuredImage: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    featuredImageStyle: {
      borderRadius: 32,
    },
    featuredContent: {
      padding: 24,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    featuredPreTitle: {
      color: colors.white,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    featuredTitle: {
      color: colors.white,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 32,
      marginBottom: 8,
    },
    featuredSubtitle: {
      color: colors.white,
      fontSize: 14,
      lineHeight: 20,
      maxWidth: '80%',
    },
    splitRow: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: SCREEN_PADDING,
      marginBottom: 18,
    },
    carousel: {
      paddingLeft: SCREEN_PADDING,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 50,
      marginBottom: 16,
    },
    smallCard: {
      width: CARD_WIDTH,
      minHeight: CARD_HEIGHT,
      borderRadius: 28,
      padding: 18,
      marginRight: 18,
      backgroundColor: colors.white,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    smallCardTag: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: colors.accent,
      marginBottom: 14,
    },
    smallCardTagText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 12,
    },
    smallCardLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    smallCardText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });
