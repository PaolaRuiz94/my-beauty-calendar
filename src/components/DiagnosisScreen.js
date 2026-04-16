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
    {
      name: 'KATIVA SHAMPOO ARGAN X 1000ML',
      link: 'https://almacensandra.com.co/product/p-10437-kativa-shampoo-argan-x-1000ml',
    },
  ],
  hydra: [
    {
      name: 'KERASTASE GLOSS ABSOLU MASQUE HYDRA-GLAZE X 200ML',
      link: 'https://almacensandra.com.co/product/p-49862-kerastase-gloss-absolu-masque-hydra-glaze-x-200ml',
    },
    {
      name: 'ATHOS ACEITE DE COCO X 1000 ML',
      link: 'https://almacensandra.com.co/product/p-2833-athos-aceite-de-coco-x-1000-ml',
    },
  ],
  repair: [
    {
      name: 'KERASTASE GLOSS ABSOLU MASQUE HYDRA-GLAZE X 200ML',
      link: 'https://almacensandra.com.co/product/p-49862-kerastase-gloss-absolu-masque-hydra-glaze-x-200ml',
    },
  ],
  volume: [
    {
      name: 'KATIVA SHAMPOO ARGAN X 1000ML',
      link: 'https://almacensandra.com.co/product/p-10437-kativa-shampoo-argan-x-1000ml',
    },
    {
      name: 'SALERM CREMA DE PEINAR SALERM 21 X 200GR',
      link: 'https://almacensandra.com.co/product/p-702-salerm-crema-de-peinar-salerm-21-x-200gr',
    },
  ],
  curl: [
    {
      name: 'YUMA ESPUMA CAPILAR HIDRATANTE CREADOR DE RIZOS X 200ML',
      link: 'https://almacensandra.com.co/product/p-40082-yuma-espuma-capilar-hidratante-creador-de-rizos-x-200ml',
    },
    {
      name: 'SALERM CREMA DE PEINAR SALERM 21 X 200GR',
      link: 'https://almacensandra.com.co/product/p-702-salerm-crema-de-peinar-salerm-21-x-200gr',
    },
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

  const getRecommendedProducts = (answersObject) => {
    const productSet = [];

    if (answersObject.scalp === 'Grasa') {
      productSet.push(...productDB.balance);
    }

    if (answersObject.scalp === 'Seco') {
      productSet.push(...productDB.hydra);
    }

    if (answersObject.porosity === 'Alta') {
      productSet.push(...productDB.hydra, ...productDB.repair);
    }

    if (answersObject.porosity === 'Baja') {
      productSet.push(...productDB.volume);
    }

    if (answersObject.density === 'Fina') {
      productSet.push(...productDB.volume);
    }

    if (answersObject.texture === 'Rizado') {
      productSet.push(...productDB.curl);
    }

    if (answersObject.chemical === 'Químico') {
      productSet.push(...productDB.repair);
    }

    if (productSet.length === 0) {
      productSet.push(...productDB.balance);
    }

    const uniqueProducts = [];
    const seenLinks = new Set();

    for (const product of productSet) {
      if (!seenLinks.has(product.link)) {
        uniqueProducts.push(product);
        seenLinks.add(product.link);
      }
    }

    return uniqueProducts;
  };

  const getRoutineSteps = (answersObject, damageLevel) => {
    const shampoo =
      answersObject.scalp === 'Grasa'
        ? 'Shampoo equilibrante para eliminar exceso de grasa'
        : answersObject.scalp === 'Seco'
        ? 'Shampoo nutritivo suave'
        : 'Shampoo hidratante ligero';

    const conditioner =
      answersObject.porosity === 'Baja'
        ? 'Acondicionador ligero para brindar desenredo sin peso'
        : 'Acondicionador nutritivo con argán';

    const treatment =
      damageLevel === 'Alto'
        ? 'Mascarilla reparadora profunda'
        : 'Tratamiento hidratante semanal';

    const leaveIn =
      answersObject.texture === 'Rizado'
        ? 'Crema de peinar para definir rizos'
        : 'Crema ligera para peinar y proteger';

    const oil =
      answersObject.scalp === 'Grasa'
        ? 'Aceite ligero solo en puntas'
        : 'Aceite de coco para sellar y aportar brillo';

    return [
      { label: 'Shampoo', value: shampoo },
      { label: 'Acondicionador', value: conditioner },
      { label: 'Tratamiento', value: treatment },
      { label: 'Crema de peinar / espuma', value: leaveIn },
      { label: 'Aceite', value: oil },
    ];
  };

  const getPersonalizedTips = (answersObject, damageLevel) => {
    const tips = [];

    if (answersObject.scalp === 'Grasa') {
      tips.push({
        title: 'Evita sulfatos fuertes',
        description:
          'Los sulfatos agresivos pueden aumentar la oleosidad y resecar el cuero cabelludo. Opta por fórmulas suaves que limpien sin irritar.',
      });
    } else if (answersObject.scalp === 'Seco') {
      tips.push({
        title: 'Prioriza fórmulas cremosas',
        description:
          'Un cuero cabelludo seco se beneficia de productos nutritivos. Evita lavados muy frecuentes y usa ingredientes hidratantes.',
      });
    } else {
      tips.push({
        title: 'Mantén una limpieza suave',
        description:
          'Un equilibrio ligero mantiene sano el cuero cabelludo normal. Usa productos que limpien sin eliminar los aceites naturales.',
      });
    }

    if (damageLevel === 'Alto') {
      tips.push({
        title: 'Reduce el uso de calor',
        description:
          'El calor frecuente daña la estructura del cabello. Alterna herramientas térmicas con secados al aire y usa protectores térmicos.',
      });
    } else if (damageLevel === 'Moderado') {
      tips.push({
        title: 'Usa protección térmica',
        description:
          'Protege tu cabello antes de peinarlo con calor y acompaña los tratamientos con mascarillas reparadoras.',
      });
    } else {
      tips.push({
        title: 'No sobrecargues tu fibra',
        description:
          'Si tu cabello está poco dañado, elige productos ligeros y evita tratamientos innecesarios para conservar su salud.',
      });
    }

    if (answersObject.porosity === 'Alta') {
      tips.push({
        title: 'Sella la cutícula',
        description:
          'La porosidad alta necesita retener hidratación. Usa aceites ligeros y evita el agua demasiado caliente para evitar pérdida de humedad.',
      });
    } else if (answersObject.porosity === 'Baja') {
      tips.push({
        title: 'Deja actuar los productos',
        description:
          'La porosidad baja necesita más tiempo para absorber nutrientes. Aplica tratamientos y déjalos actuar antes de enjuagar.',
      });
    } else {
      tips.push({
        title: 'Equilibra hidratación y nutrición',
        description:
          'La porosidad media responde bien a fórmulas equilibradas que aportan hidratación sin dejar peso.',
      });
    }

    return tips;
  };

  const getFrequencyRecommendations = (answersObject, damageLevel) => {
    return [
      {
        label: 'Lavado semanal',
        value:
          answersObject.scalp === 'Grasa'
            ? '3 veces por semana'
            : answersObject.scalp === 'Seco'
            ? '1-2 veces por semana'
            : '2-3 veces por semana',
      },
      {
        label: 'Tratamientos',
        value:
          damageLevel === 'Alto'
            ? 'Una vez por semana'
            : damageLevel === 'Moderado'
            ? 'Cada 10-12 días'
            : '2 veces al mes',
      },
      {
        label: 'Hidratación',
        value:
          answersObject.porosity === 'Alta'
            ? '2 veces por semana'
            : answersObject.porosity === 'Baja'
            ? '1 vez por semana'
            : '1-2 veces por semana',
      },
    ];
  };

  const generateResult = (answersObject) => {
    const damageLevel = getDamageLevel(answersObject);
    const resultObject = {
      hairType: getHairType(answersObject),
      porosity: getPorosity(answersObject.porosity),
      density: answersObject.density,
      scalpCondition: getScalpCondition(answersObject.scalp),
      damageLevel,
    };
    const recommendedProducts = getRecommendedProducts(answersObject);
    setProducts(recommendedProducts);
    setResult({
      ...resultObject,
      recommendations: {
        routine: getRoutineSteps(answersObject, damageLevel),
        products: recommendedProducts,
        tips: getPersonalizedTips(answersObject, damageLevel),
        frequency: getFrequencyRecommendations(answersObject, damageLevel),
      },
    });
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

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Rutina recomendada</Text>
            {result.recommendations.routine.map((step) => (
              <View key={step.label} style={styles.routineRow}>
                <Text style={styles.routineLabel}>{step.label}</Text>
                <Text style={styles.routineValue}>{step.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Productos sugeridos</Text>
            {result.recommendations.products.map((product, index) => (
              <TouchableOpacity
                key={index}
                style={styles.productSuggestionCard}
                onPress={() => openLink(product.link)}
              >
                <Text style={styles.productSuggestionName}>{product.name}</Text>
                <Text style={styles.productSuggestionAction}>Ver</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Tips personalizados</Text>
            {result.recommendations.tips.map((tip, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tipCard}
                onPress={() =>
                  navigation.navigate('TipDetail', {
                    title: tip.title,
                    description: tip.description,
                  })
                }
              >
                <Text style={styles.tipCardTitle}>{tip.title}</Text>
                <Text style={styles.tipCardPreview} numberOfLines={2}>
                  {tip.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Frecuencia de uso</Text>
            {result.recommendations.frequency.map((item) => (
              <View key={item.label} style={styles.frequencyRow}>
                <Text style={styles.frequencyLabel}>{item.label}</Text>
                <Text style={styles.frequencyValue}>{item.value}</Text>
              </View>
            ))}
          </View>
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
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
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
    sectionCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#EDE1DD',
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    sectionHeading: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    routineRow: {
      marginBottom: 12,
    },
    routineLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    routineValue: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 22,
    },
    productSuggestionCard: {
      backgroundColor: '#F7ECEE',
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    productSuggestionName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    productSuggestionAction: {
      fontSize: 14,
      fontWeight: '700',
      color: '#D6A4A4',
    },
    tipText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 10,
    },
    frequencyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    frequencyLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    frequencyValue: {
      fontSize: 15,
      color: colors.textSecondary,
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
