import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24;
const SLIDE_WIDTH = width - 40;

const questions = [
  {
    id: 'scalp',
    title: '¿Cómo describirías tu cuero cabelludo?',
    options: [
      {
        value: 'Grasa',
        title: 'Raíz oleosa',
        desc: 'Sientes brillo y peso en la raíz al final del día.',
      },
      {
        value: 'Normal',
        title: 'Equilibrado',
        desc: 'La raíz se mantiene fresca y con balance natural.',
      },
      {
        value: 'Seco',
        title: 'Raíz seca',
        desc: 'La piel se siente tirante y puede picar.',
      },
    ],
  },
  {
    id: 'porosity',
    title: '¿Cómo absorbe tu cabello agua y productos?',
    options: [
      {
        value: 'Alta',
        title: 'Alta porosidad',
        desc: 'El cabello absorbe rápido, pero también pierde hidratación fácil.',
      },
      {
        value: 'Media',
        title: 'Porosidad media',
        desc: 'Buena absorción y retención cuando está bien cuidado.',
      },
      {
        value: 'Baja',
        title: 'Baja porosidad',
        desc: 'Los productos tardan en penetrar y se siente algo impermeable.',
      },
    ],
  },
  {
    id: 'density',
    title: '¿Cómo es la cantidad de tu cabello?',
    options: [
      {
        value: 'Fina',
        title: 'Cabello fino',
        desc: 'La fibra es delicada y se busca volumen ligero.',
      },
      {
        value: 'Media',
        title: 'Cabello medio',
        desc: 'Textura equilibrada con buena versatilidad.',
      },
      {
        value: 'Densa',
        title: 'Cabello denso',
        desc: 'Se siente abundante y con cuerpo natural.',
      },
    ],
  },
  {
    id: 'chemical',
    title: '¿Tu cabello está tratado químicamente?',
    options: [
      {
        value: 'Químico',
        title: 'Tratado químicamente',
        desc: 'Color o alisado reciente que requiere cuidado reparador.',
      },
      {
        value: 'Calor',
        title: 'Solo calor',
        desc: 'El cabello está natural pero usa calor con frecuencia.',
      },
      {
        value: 'Natural',
        title: 'Natural',
        desc: 'No hay procesos químicos, mantiene su estado original.',
      },
    ],
  },
  {
    id: 'texture',
    title: '¿Cuál es tu textura de cabello?',
    options: [
      {
        value: 'Lacio',
        title: 'Lacio',
        desc: 'Textura suave y lineal con brillo natural.',
      },
      {
        value: 'Ondulado',
        title: 'Ondulado',
        desc: 'Movimiento natural con ondas suaves y volumen ligero.',
      },
      {
        value: 'Rizado',
        title: 'Rizado',
        desc: 'Rizos definidos que necesitan hidratación y forma.',
      },
    ],
  },
];

const productDB = {
  balance: [
    { name: 'Shampoo balanceante', link: 'https://www.falabella.com' },
  ],
  hydra: [
    { name: 'Mascarilla hidratante con argán', link: 'https://www.amazon.com' },
  ],
  repair: [
    { name: 'Tratamiento reparador profundo', link: 'https://www.sephora.com' },
  ],
  volume: [
    { name: 'Mousse ligero de volumen', link: 'https://www.amazon.com' },
  ],
  curl: [
    { name: 'Crema definidora de rizos', link: 'https://www.mercadolibre.com' },
  ],
};

export default function DiagnosisScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const tabBarHeight = useBottomTabBarHeight();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [image, setImage] = useState(null);
  const [products, setProducts] = useState([]);
  const flatListRef = useRef(null);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const selectedAnswer = answers[questions[currentQuestion].id] || null;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permiso requerido');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    if (currentQuestion < questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      return;
    }

    const finalAnswers = { ...answers };
    generateResult(finalAnswers);
  };

  const getScalpCondition = (value) => {
    if (value === 'Grasa') return 'Cuero cabelludo graso';
    if (value === 'Seco') return 'Cuero cabelludo seco';
    return 'Cuero cabelludo equilibrado';
  };

  const getPorosity = (value) => {
    if (value === 'Alta') return 'Alta';
    if (value === 'Baja') return 'Baja';
    return 'Media';
  };

  const getDamageLevel = (answersObject) => {
    const hasChemical = answersObject.chemical === 'Químico';
    const highPorosity = answersObject.porosity === 'Alta';
    if (hasChemical && highPorosity) return 'Alto';
    if (hasChemical || highPorosity) return 'Moderado';
    if (answersObject.scalp === 'Seco') return 'Moderado';
    return 'Bajo';
  };

  const getHairType = (answersObject) => {
    const densityLabel =
      answersObject.density === 'Fina'
        ? 'ligero'
        : answersObject.density === 'Media'
        ? 'medio'
        : 'denso';
    const treatedLabel = answersObject.chemical === 'Natural' ? 'natural' : 'tratado';
    return `${answersObject.texture} ${densityLabel} / ${treatedLabel}`;
  };

  const getRecommendations = (answersObject) => {
    const recs = [];
    const productSet = [];

    if (answersObject.scalp === 'Grasa') {
      recs.push('Equilibra la raíz con un shampoo suave libre de sulfatos.');
      productSet.push(...productDB.balance);
    }

    if (answersObject.porosity === 'Alta') {
      recs.push('Sella la fibra con tratamientos nutritivos y evita el exceso de calor.');
      productSet.push(...productDB.hydra, ...productDB.repair);
    }

    if (answersObject.porosity === 'Baja') {
      recs.push('Usa fórmulas ligeras y deja que los productos penetren lentamente.');
      productSet.push(...productDB.volume);
    }

    if (answersObject.density === 'Fina') {
      recs.push('Elige productos ligeros que no pesen el cabello.');
      productSet.push(...productDB.volume);
    }

    if (answersObject.texture === 'Rizado') {
      recs.push('Hidrata y define cada rizo con crema nutritiva.');
      productSet.push(...productDB.curl);
    }

    if (answersObject.chemical === 'Químico') {
      recs.push('Prioriza reparadores y mascarillas profundas.');
      productSet.push(...productDB.repair);
    }

    if (!recs.length) {
      recs.push('Sigue una rutina equilibrada con limpieza suave e hidratación regular.');
    }

    return { recs, products: Array.from(new Set(productSet)) };
  };

  const generateResult = (answersObject) => {
    const resultObject = {
      hairType: getHairType(answersObject),
      porosity: getPorosity(answersObject.porosity),
      density: answersObject.density,
      scalpCondition: getScalpCondition(answersObject.scalp),
      damageLevel: getDamageLevel(answersObject),
    };
    const { recs, products: recommendedProducts } = getRecommendations(answersObject);
    setProducts(recommendedProducts);
    setResult({ ...resultObject, recommendations: recs });
  };

  const openLink = (url) => {
    Linking.openURL(url);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentQuestion(viewableItems[0].index);
    }
  }).current;

  if (result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 40 }]}
        >
          <Text style={styles.title}>Tu diagnóstico capilar</Text>
          {image && <Image source={{ uri: image }} style={styles.image} />}
          <View style={styles.resultGrid}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Tipo de cabello</Text>
              <Text style={styles.resultValue}>{result.hairType}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Porosidad</Text>
              <Text style={styles.resultValue}>{result.porosity}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Densidad</Text>
              <Text style={styles.resultValue}>{result.density}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Cuero cabelludo</Text>
              <Text style={styles.resultValue}>{result.scalpCondition}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Daño</Text>
              <Text style={styles.resultValue}>{result.damageLevel}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Recomendaciones</Text>
          {result.recommendations.map((item, index) => (
            <Text key={index} style={styles.recommendationText}>• {item}</Text>
          ))}
          <Text style={styles.subtitle}>Productos recomendados</Text>
          {products.map((product, index) => (
            <TouchableOpacity
              key={index}
              style={styles.productCard}
              onPress={() => openLink(product.link)}
            >
              <Text style={styles.productText}>{product.name}</Text>
              <Text style={styles.buy}>Comprar →</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setResult(null);
              setAnswers({});
              setCurrentQuestion(0);
              setProducts([]);
              setImage(null);
            }}
          >
            <Text style={styles.resetText}>Volver a comenzar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 140 }]}
      >
        <View style={styles.pageContent}>
          <Text style={styles.title}>Diagnóstico Capilar</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}> 
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Paso {currentQuestion + 1} de {questions.length}
            </Text>
          </View>

          <FlatList
            ref={flatListRef}
            data={questions}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => {
            const selected = answers[item.id];
            return (
              <View style={[styles.slide, { width: SLIDE_WIDTH }]}>                
                <View style={styles.slideContent}>
                  {index === 0 ? (
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <Text style={styles.uploadText}>
                        {image ? 'Cambiar foto' : 'Subir foto'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {image ? <Image source={{ uri: image }} style={styles.image} /> : null}

                  <Text style={styles.stepLabel}>Pregunta {index + 1} de {questions.length}</Text>
                  <Text style={styles.question}>{item.title}</Text>

                  <View style={styles.optionsRow}>
                    {item.options.map((option) => {
                      const isActive = selected === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionCard,
                            isActive && styles.optionCardActive,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => handleSelectOption(item.id, option.value)}
                        >
                          <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
                            {option.title}
                          </Text>
                          <Text style={[styles.optionDesc, isActive && styles.optionDescActive]}>
                            {option.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                </View>
              </View>
            );
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig.current}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
      </ScrollView>
      <View style={[styles.fixedNextContainer, { bottom: tabBarHeight + 10 }]}> 
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedAnswer && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedAnswer}
        >
          <Text style={[styles.nextText, !selectedAnswer && styles.nextTextDisabled]}>
            {isLastQuestion ? 'Ver resultado' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FAF8F6',
    },
    container: {
      flex: 1,
      backgroundColor: '#FAF8F6',
      paddingTop: 16,
      paddingHorizontal: 20,
    },
    scrollContent: {
      padding: 20,
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#FAF8F6',
    },
    pageContent: {
      flex: 1,
    },
    fixedNextContainer: {
      position: 'absolute',
      left: 20,
      right: 20,
      zIndex: 10,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.textPrimary,
      marginBottom: 18,
    },
    progressRow: {
      marginBottom: 18,
    },
    progressBar: {
      width: '100%',
      height: 8,
      borderRadius: 999,
      backgroundColor: '#EDE6E3',
      overflow: 'hidden',
      marginBottom: 10,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#D6A4A4',
    },
    progressText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    slide: {
      width: SLIDE_WIDTH,
      paddingHorizontal: 20,
      paddingBottom: 180,
      justifyContent: 'space-between',
    },
    flatListContent: {
      paddingBottom: 16,
    },
    uploadButton: {
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
      marginBottom: 20,
    },
    uploadText: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 15,
    },
    image: {
      width: '100%',
      height: 220,
      borderRadius: 24,
      marginBottom: 18,
    },
    stepLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    question: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    optionsRow: {
      width: '100%',
    },
    slideContent: {
      width: '100%',
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#ECE0DD',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    optionCardActive: {
      backgroundColor: '#D6A4A4',
      borderColor: '#D6A4A4',
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    optionTitleActive: {
      color: '#FFFFFF',
    },
    optionDesc: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    optionDescActive: {
      color: '#F8EEF0',
    },
    nextButton: {
      width: '100%',
      backgroundColor: '#D6A4A4',
      borderRadius: 28,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    nextButtonDisabled: {
      backgroundColor: '#E8D8D6',
    },
    nextText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    nextTextDisabled: {
      color: '#7F6A6A',
    },
    resultGrid: {
      width: '100%',
      marginTop: 20,
    },
    resultBox: {
      backgroundColor: '#F7ECEE',
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#EAD7DB',
      shadowColor: '#CFAEB7',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    resultLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 6,
    },
    resultValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      marginTop: 18,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    recommendationText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 8,
    },
    productCard: {
      backgroundColor: '#F7ECEE',
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#EAD7DB',
      shadowColor: '#CFAEB7',
      shadowOpacity: 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    productText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    buy: {
      color: '#D6A4A4',
      fontWeight: '700',
      fontSize: 14,
    },
    resetButton: {
      marginTop: 22,
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: '#D6A4A4',
      paddingVertical: 16,
      alignItems: 'center',
    },
    resetText: {
      color: '#D6A4A4',
      fontWeight: '700',
      fontSize: 16,
    },
  });
