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
import { productDB, recommendationDB } from '../data/productDB';

const { width } = Dimensions.get('window');
const CARD_PADDING = 24;
const SLIDE_WIDTH = width - 40;

const questions = [
  {
    id: 'objective',
    title: '¿Cuál es tu objetivo capilar?',
    options: [
      {
        value: 'crecimiento',
        title: 'Crecimiento',
        desc: 'Apoya el crecimiento y la fortaleza del cabello.',
      },
      {
        value: 'hidratación',
        title: 'Hidratación',
        desc: 'Aporta suavidad y flexibilidad a la fibra.',
      },
      {
        value: 'reparación',
        title: 'Reparación',
        desc: 'Repara y fortalece el cabello dañado.',
      },
      {
        value: 'definición',
        title: 'Definición',
        desc: 'Mejora la forma de tus rizos u ondas.',
      },
      {
        value: 'volumen',
        title: 'Volumen',
        desc: 'Aporta cuerpo y movimiento ligero.',
      },
      {
        value: 'transición',
        title: 'Transición capilar',
        desc: 'Empiezo a usar mi cabello natural sin procesos químicos.',
      },
    ],
  },
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
  {
    id: 'photo',
    title: 'Sube una foto de tu cabello (opcional)',
    options: [],
  },
];

export default function DiagnosisScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const tabBarHeight = useBottomTabBarHeight();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [routinePlan, setRoutinePlan] = useState([]);
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
    if (!selectedAnswer && currentQuestion < questions.length - 1) return;

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

  const getObjectiveLabel = (value) => {
    switch (value) {
      case 'crecimiento':
        return 'Crecimiento';
      case 'hidratación':
        return 'Hidratación';
      case 'reparación':
        return 'Reparación';
      case 'definición':
        return 'Definición';
      case 'volumen':
        return 'Volumen';
      case 'transición':
        return 'Transición capilar';
      default:
        return 'Objetivo personalizado';
    }
  };

  const getRoutinePlan = (answersObject, damageLevel) => {
    const isCurlyOrWavy =
      answersObject.texture === 'Rizado' || answersObject.texture === 'Ondulado';
    const objective = answersObject.objective;

    const day1Steps = [
      'Aceite capilar',
      'Lavado detox',
      objective === 'volumen'
        ? 'Mascarilla ligera voluminizadora'
        : objective === 'reparación'
        ? 'Mascarilla reparadora'
        : objective === 'hidratación'
        ? 'Mascarilla hidratante'
        : objective === 'transición'
        ? 'Mascarilla nutritiva suave'
        : 'Mascarilla nutritiva',
      'Acondicionador',
      isCurlyOrWavy
        ? 'Definición con crema de peinar, gel y aceite'
        : 'Leave-in ligero',
    ];

    const day2Steps = isCurlyOrWavy
      ? [
          'Refresco de rizos',
          objective === 'transición'
            ? 'Protección suave sin calor'
            : 'Crema ligera para reactivar la definición',
        ]
      : [
          'Shampoo en seco',
          objective === 'transición'
            ? 'Spray refrescante suave y cuidado ligero'
            : 'Spray refrescante ligero',
        ];

    const day3Steps = [
      'Aceite capilar',
      'Shampoo suave',
      objective === 'reparación'
        ? 'Tratamiento reparador'
        : objective === 'volumen'
        ? 'Tratamiento ligero voluminizador'
        : objective === 'hidratación'
        ? 'Tratamiento hidratante'
        : objective === 'transición'
        ? 'Tratamiento nutritivo suave'
        : 'Tratamiento hidratante',
      'Acondicionador',
      isCurlyOrWavy ? 'Definición ligera' : 'Leave-in ligero',
    ];

    const day4Steps = objective === 'transición'
      ? [
          'Aceite ligero en las puntas',
          'Protección sin calor',
          'Rutina suave de mantenimiento',
        ]
      : [
          'Aceite ligero o serum',
          'Protege con leave-in',
          'Evita calor intenso',
        ];

    return [
      { day: 1, title: 'Lavado detox + reinicio', steps: day1Steps },
      { day: 2, title: isCurlyOrWavy ? 'Refresco y definición' : 'Refresco ligero', steps: day2Steps },
      { day: 3, title: 'Cuidado profundo', steps: day3Steps },
      { day: 4, title: 'Cuidado suave', steps: day4Steps },
    ];
  };

  const getRecommendedProducts = (answersObject) => {
    const productSet = [];

    if (answersObject.scalp === 'Grasa') {
      productSet.push(...recommendationDB.balance);
    }

    if (answersObject.scalp === 'Seco') {
      productSet.push(...recommendationDB.hydra);
    }

    if (answersObject.porosity === 'Alta') {
      productSet.push(...recommendationDB.hydra, ...recommendationDB.repair);
    }

    if (answersObject.porosity === 'Baja') {
      productSet.push(...recommendationDB.volume);
    }

    if (answersObject.density === 'Fina') {
      productSet.push(...recommendationDB.volume);
    }

    if (answersObject.texture === 'Rizado') {
      productSet.push(...recommendationDB.curl);
    }

    if (answersObject.chemical === 'Químico') {
      productSet.push(...recommendationDB.repair);
    }

    if (productSet.length === 0) {
      productSet.push(...recommendationDB.balance);
    }

    const uniqueProducts = [];
    const seenLinks = new Set();

    for (const product of productSet) {
      if (!seenLinks.has(product.link)) {
        uniqueProducts.push(product);
        seenLinks.add(product.link);
      }
    }

    const hasOil = uniqueProducts.some((product) => product.category?.trim() === 'Aceites');
    if (!hasOil && productDB.aceites?.length > 0) {
      uniqueProducts.push(productDB.aceites[0]);
    }

    return uniqueProducts;
  };

  const getCategorizedProducts = (products) => {
    const categories = {
      Shampoo: [],
      Acondicionador: [],
      Tratamiento: [],
      'Crema de Peinar': [],
      Gel: [],
      Espumas: [],
      Aceites: [],
    };

    products.forEach((product) => {
      const key = product.category?.trim();
      if (categories[key]) {
        categories[key].push(product);
      }
    });

    return categories;
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
      objective: getObjectiveLabel(answersObject.objective),
      porosity: getPorosity(answersObject.porosity),
      density: answersObject.density,
      scalpCondition: getScalpCondition(answersObject.scalp),
      damageLevel,
    };
    const recommendedProducts = getRecommendedProducts(answersObject);
    const routinePlanResult = getRoutinePlan(answersObject, damageLevel);
    setProducts(recommendedProducts);
    setRoutinePlan(routinePlanResult);
    setResult({
      ...resultObject,
      recommendations: {
        routine: getRoutineSteps(answersObject, damageLevel),
        products: recommendedProducts,
        productsByCategory: getCategorizedProducts(recommendedProducts),
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
              <Text style={styles.resultLabel}>Objetivo</Text>
              <Text style={styles.resultValue}>{result.objective}</Text>
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
            {Object.entries(result.recommendations.productsByCategory).map(
              ([category, productsInCategory]) =>
                productsInCategory.length > 0 ? (
                  <View key={category} style={styles.categoryGroup}>
                    <Text style={styles.categoryHeading}>
                      {category === 'Aceites' ? 'Aceite' : category}
                    </Text>
                    {productsInCategory.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productSuggestionCard}
                        onPress={() => openLink(product.link)}
                      >
                        <Text style={styles.productSuggestionName}>{product.name}</Text>
                        <Text style={styles.productSuggestionAction}>Ver</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null,
            )}
            {Object.values(result.recommendations.productsByCategory).every(
              (productsInCategory) => productsInCategory.length === 0,
            ) && (
              <Text style={styles.emptyText}>
                No se encontraron productos recomendados por categoría.
              </Text>
            )}
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
            style={styles.calendarButton}
            onPress={() =>
              navigation.navigate('Calendario', {
                screen: 'CalendarMain',
                params: {
                  routinePlan,
                  objective: result.objective,
                },
              })
            }
          >
            <Text style={styles.calendarButtonText}>Ver rutina en calendario</Text>
          </TouchableOpacity>
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
                  {item.id === 'photo' ? (
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      {image ? (
                        <Image source={{ uri: image }} style={styles.uploadImage} />
                      ) : (
                        <View style={styles.placeholder}>
                          <Text style={styles.uploadText}>
                            Subir foto
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  <Text style={styles.stepLabel}>
                    {item.id === 'photo' ? 'Paso final' : `Pregunta ${index + 1} de ${questions.length}`}
                  </Text>
                  <Text style={styles.question}>{item.title}</Text>

                  {item.id !== 'photo' && (
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
                  )}
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
      <View style={[styles.fixedNextContainer, { bottom: tabBarHeight - 40 }]}> 
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedAnswer && currentQuestion < questions.length - 1) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedAnswer && currentQuestion < questions.length - 1}
        >
          <Text style={[styles.nextText, (!selectedAnswer && currentQuestion < questions.length - 1) && styles.nextTextDisabled]}>
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
      marginTop: 20,
      marginBottom: 18,
    },
    progressRow: {
      marginBottom: 10,
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
      width: 200,
      height: 200,
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: '#ECE0DD',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
      alignSelf: 'center',
      marginBottom: 194,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadText: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 16,
      textAlign: 'center',
    },
    uploadImage: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      
    },
    placeholder: {
      justifyContent: 'center',
      alignItems: 'center',
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
      marginBottom: 4,
    },
    question: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    optionsRow: {
      width: '100%',
      marginTop: 30,
    },
    slideContent: {
      width: '100%',
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    optionCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 16,
      marginBottom: 10,
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
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    optionTitleActive: {
      color: '#FFFFFF',
    },
    optionDesc: {
      fontSize: 14,
      lineHeight: 20,
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
    categoryGroup: {
      marginBottom: 16,
    },
    categoryHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
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
    calendarButton: {
      marginTop: 16,
      backgroundColor: '#D6A4A4',
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    calendarButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
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
