import React, { useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { productDB, recommendationDB } from '../data/productDB';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const questions = [
  {
    id: 'objective',
    title: '¿Cuál es tu objetivo capilar?',
    options: [
      { value: 'crecimiento', title: 'Crecimiento', desc: 'Apoya el crecimiento y la fortaleza del cabello.' },
      { value: 'hidratación', title: 'Hidratación', desc: 'Aporta suavidad y flexibilidad a la fibra.' },
      { value: 'reparación', title: 'Reparación', desc: 'Repara y fortalece el cabello dañado.' },
      { value: 'definición', title: 'Definición', desc: 'Mejora la forma de tus rizos u ondas.' },
      { value: 'volumen', title: 'Volumen', desc: 'Aporta cuerpo y movimiento ligero.' },
      { value: 'transición', title: 'Transición capilar', desc: 'Empiezo a usar mi cabello natural sin procesos químicos.' },
    ],
  },
  {
    id: 'scalp',
    title: '¿Cómo describirías tu cuero cabelludo?',
    options: [
      { value: 'Grasa', title: 'Raíz oleosa', desc: 'Sientes brillo y peso en la raíz al final del día.' },
      { value: 'Normal', title: 'Equilibrado', desc: 'La raíz se mantiene fresca y con balance natural.' },
      { value: 'Seco', title: 'Raíz seca', desc: 'La piel se siente tirante y puede picar.' },
    ],
  },
  {
    id: 'porosity',
    title: '¿Cómo absorbe tu cabello agua y productos?',
    options: [
      { value: 'Alta', title: 'Alta porosidad', desc: 'El cabello absorbe rápido, pero también pierde hidratación fácil.' },
      { value: 'Media', title: 'Porosidad media', desc: 'Buena absorción y retención cuando está bien cuidado.' },
      { value: 'Baja', title: 'Baja porosidad', desc: 'Los productos tardan en penetrar y se siente algo impermeable.' },
    ],
  },
  {
    id: 'density',
    title: '¿Cómo es la cantidad de tu cabello?',
    options: [
      { value: 'Fina', title: 'Cabello fino', desc: 'La fibra es delicada y se busca volumen ligero.' },
      { value: 'Media', title: 'Cabello medio', desc: 'Textura equilibrada con buena versatilidad.' },
      { value: 'Densa', title: 'Cabello denso', desc: 'Se siente abundante y con cuerpo natural.' },
    ],
  },
  {
    id: 'chemical',
    title: '¿Tu cabello está tratado químicamente?',
    options: [
      { value: 'Químico', title: 'Tratado químicamente', desc: 'Color o alisado reciente que requiere cuidado reparador.' },
      { value: 'Calor', title: 'Solo calor', desc: 'El cabello está natural pero usa calor con frecuencia.' },
      { value: 'Natural', title: 'Natural', desc: 'No hay procesos químicos, mantiene su estado original.' },
    ],
  },
  {
    id: 'texture',
    title: '¿Cuál es tu textura de cabello?',
    options: [
      { value: 'Lacio', title: 'Lacio', desc: 'Textura suave y lineal con brillo natural.' },
      { value: 'Ondulado', title: 'Ondulado', desc: 'Movimiento natural con ondas suaves y volumen ligero.' },
      { value: 'Rizado', title: 'Rizado', desc: 'Rizos definidos que necesitan hidratación y forma.' },
    ],
  },
  {
    id: 'photo',
    title: 'Sube una foto de tu cabello (opcional)',
    options: [],
  },
];

// ─── StatChip ─────────────────────────────────────────────────────────────────

function StatChip({ icon, label, value, valueColor }) {
  return (
    <View style={styles.statChip}>
      <View style={styles.statChipIcon}>
        <Ionicons name={icon} size={15} color="#D6A4A4" />
      </View>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={[styles.statChipValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiagnosisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [routinePlan, setRoutinePlan] = useState([]);
  const [image, setImage] = useState(null);
  const flatListRef = useRef(null);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const selectedAnswer = answers[questions[currentQuestion].id] || null;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { alert('Permiso requerido'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!selectedAnswer && currentQuestion < questions.length - 1) return;
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      return;
    }
    generateResult({ ...answers });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentQuestion(viewableItems[0].index);
    }
  }).current;

  // ── Logic ────────────────────────────────────────────────────────────────────

  const getScalpCondition = (v) =>
    v === 'Grasa' ? 'Cuero cabelludo graso' : v === 'Seco' ? 'Cuero cabelludo seco' : 'Cuero cabelludo equilibrado';

  const getPorosity = (v) => (v === 'Alta' ? 'Alta' : v === 'Baja' ? 'Baja' : 'Media');

  const buildHairProfile = (answersObject) => {
    const { scalp, porosity, density, chemical, texture, objective } = answersObject;
    const isCurly = texture === 'Rizado';
    const isWavy = texture === 'Ondulado';
    const isCurlyOrWavy = isCurly || isWavy;
    const isChemical = chemical === 'Químico';
    const isHeatDamaged = chemical === 'Calor';
    const highPorosity = porosity === 'Alta';
    const lowPorosity = porosity === 'Baja';
    const oilyScalp = scalp === 'Grasa';
    const dryScalp = scalp === 'Seco';
    const fineDensity = density === 'Fina';
    const denseDensity = density === 'Densa';
    const needsProtein = isChemical || isHeatDamaged;
    const needsClarifying = oilyScalp || lowPorosity;
    const isScalpOilyWithDryEnds = oilyScalp && (highPorosity || isChemical);
    const stylingMethod = isCurlyOrWavy ? (highPorosity ? 'LOC' : 'LCO') : null;
    const proteinFrequencyWeeks = isChemical ? 2 : isHeatDamaged ? 3 : 4;
    let damageLevel;
    if (isChemical && highPorosity) damageLevel = 'Alto';
    else if (isChemical || (highPorosity && isHeatDamaged)) damageLevel = 'Moderado-Alto';
    else if (isHeatDamaged || highPorosity || dryScalp) damageLevel = 'Moderado';
    else damageLevel = 'Bajo';
    return {
      scalp, porosity, density, chemical, texture, objective,
      isCurly, isWavy, isCurlyOrWavy, isChemical, isHeatDamaged,
      highPorosity, lowPorosity, oilyScalp, dryScalp, fineDensity, denseDensity,
      needsProtein, needsClarifying, isScalpOilyWithDryEnds,
      stylingMethod, proteinFrequencyWeeks, damageLevel,
    };
  };

  const getHairType = (answersObject) => {
    const densityLabel = answersObject.density === 'Fina' ? 'ligero' : answersObject.density === 'Media' ? 'medio' : 'denso';
    const treatedLabel = answersObject.chemical === 'Natural' ? 'natural' : 'tratado';
    return `${answersObject.texture} ${densityLabel} / ${treatedLabel}`;
  };

  const getObjectiveLabel = (value) => {
    const map = { crecimiento: 'Crecimiento', hidratación: 'Hidratación', reparación: 'Reparación', definición: 'Definición', volumen: 'Volumen', transición: 'Transición capilar' };
    return map[value] || 'Objetivo personalizado';
  };

  const getRoutinePlan = (profile) => {
    const { isCurly, isWavy, isCurlyOrWavy, objective, oilyScalp, dryScalp, highPorosity, needsProtein, isChemical, isHeatDamaged, damageLevel, fineDensity } = profile;
    const detoxShampoo = oilyScalp ? 'Shampoo clarificante (detox) solo en raíz para resetear el cabello' : 'Shampoo clarificante (detox) para resetear el cabello';
    const hydraShampoo = oilyScalp ? 'Shampoo equilibrante solo en la raíz' : dryScalp ? 'Shampoo nutritivo suave con masaje circular en cuero cabelludo' : 'Shampoo hidratante (sin frotar medios ni puntas)';
    const deepTreatment = objective === 'reparación' || damageLevel === 'Alto' ? 'Mascarilla reparadora profunda (20-30 min)' : objective === 'hidratación' || highPorosity ? 'Mascarilla hidratante profunda (15-20 min)' : objective === 'volumen' ? 'Mascarilla voluminizadora ligera (10 min)' : 'Mascarilla nutritiva (15 min)';
    const conditioner = highPorosity ? 'Acondicionador nutritivo (todo el largo) — enjuague con agua fría' : 'Acondicionador en medios y puntas — enjuague templado';
    const stylingDaySteps = isCurly ? ['Crema de peinar en cabello húmedo (medios → puntas, scrunch)', fineDensity ? 'Gel ligero para rizos finos (scrunch suave, no presionar)' : 'Gel para definir y fijar rizos (scrunch)'] : isWavy ? ['Leave-in ligero o crema suave (medios y puntas)', 'Espuma o gel ligero para ondas (scrunch)'] : ['Leave-in ligero o sérum (medios y puntas)'];
    const refreshDaySteps = isCurly ? ['Spray de agua + crema ligera para reactivar rizos (scrunch)', 'Gel o mousse para sellar y refrescar rizos', 'Aceite ligero en puntas'] : isWavy ? ['Spray refrescante + espuma ligera en cabello húmedo', 'Aceite ligero en puntas'] : ['Shampoo en seco en raíz si es necesario', 'Aceite ligero solo en puntas'];
    const tonico = objective === 'crecimiento' ? 'Tónico capilar estimulante (cafeína o biotina) en cuero cabelludo' : oilyScalp ? 'Tónico equilibrante en cuero cabelludo' : dryScalp ? 'Tónico nutritivo en cuero cabelludo' : 'Tónico capilar fortalecedor en cuero cabelludo';
    const nightOil = isChemical || damageLevel === 'Alto' ? 'Aceite reparador (argán o queratina) solo en puntas' : highPorosity ? 'Aceite nutritivo sellador (coco o argán) en medios y puntas' : isHeatDamaged ? 'Aceite reparador ligero en puntas' : oilyScalp ? 'Aceite ultra ligero solo en puntas (máx. 2 gotas)' : 'Aceite nutritivo ligero en puntas';
    const nightSteps = ['Gorro de seda o pañuelo de satín (protege del roce al dormir)', tonico, nightOil];
    const plan3DaySteps = needsProtein ? ['Pre-poo: aceite en medios y puntas (15 min antes)', `Tratamiento proteico (dejar actuar ${isChemical ? '20' : '30'} min)`, 'Acondicionador hidratante para equilibrar proteína', ...stylingDaySteps] : ['Aceite ligero en puntas', isCurlyOrWavy ? 'Crema o mousse para mantener la forma' : 'Leave-in suave si es necesario'];
    return [
      { day: 1, title: 'Lavado detox + reinicio', daySteps: [detoxShampoo, deepTreatment, conditioner, ...stylingDaySteps], nightSteps },
      { day: 2, title: isCurlyOrWavy ? 'Refresco y activación' : 'Mantenimiento ligero', daySteps: refreshDaySteps, nightSteps },
      { day: 3, title: 'Lavado hidratante', daySteps: [hydraShampoo, conditioner, ...stylingDaySteps], nightSteps },
      { day: 4, title: needsProtein ? 'Tratamiento proteico' : 'Cuidado suave', daySteps: plan3DaySteps, nightSteps },
    ];
  };

  const getRecommendedProducts = (profile) => {
    const { oilyScalp, dryScalp, highPorosity, lowPorosity, isCurlyOrWavy, isChemical, needsProtein, fineDensity } = profile;
    const scored = new Map();
    const add = (products, score) => {
      for (const p of products) {
        if (scored.has(p.link)) scored.get(p.link).score += score;
        else scored.set(p.link, { product: p, score });
      }
    };
    if (isChemical) {
      add(productDB.shampoo.filter(p => p.brand === 'Olaplex'), 5);
      add(productDB.tratamiento.filter(p => p.brand === 'Olaplex'), 5);
      add(productDB.acondicionador.filter(p => p.brand === 'Olaplex'), 5);
      add(productDB.aceites.filter(p => p.brand === 'Olaplex'), 5);
    }
    if (oilyScalp) add(recommendationDB.balance, 3);
    else if (dryScalp) add(productDB.shampoo.filter(p => p.tags.includes('hidratante') || p.tags.includes('suave')), 3);
    else add(productDB.shampoo, 1);
    if (highPorosity) add(recommendationDB.hydra, 3);
    if (needsProtein) add(recommendationDB.repair, 3);
    if (lowPorosity) add(recommendationDB.volume, 2);
    if (isCurlyOrWavy) { add(recommendationDB.curl, 3); if (fineDensity) add(productDB.espumas, 2); }
    else if (fineDensity) add(recommendationDB.volume, 2);
    add(productDB.acondicionador, 1);
    const oils = oilyScalp ? productDB.aceites.filter(p => p.tags.includes('ligero')) : productDB.aceites;
    add(oils.length ? oils : productDB.aceites, 2);
    if (scored.size === 0) add(recommendationDB.balance, 1);
    const sorted = [...scored.values()].sort((a, b) => b.score - a.score).map(e => e.product);
    const hasOil = sorted.some(p => p.category?.trim() === 'Aceites');
    if (!hasOil && productDB.aceites?.length > 0) sorted.push(productDB.aceites[0]);
    return sorted;
  };

  const getCategorizedProducts = (products) => {
    const categories = { Shampoo: [], Acondicionador: [], Tratamiento: [], 'Crema de Peinar': [], Gel: [], Espumas: [], Aceites: [] };
    products.forEach((product) => {
      const key = product.category?.trim();
      if (categories[key]) categories[key].push(product);
    });
    return categories;
  };

  const getRoutineSteps = (profile) => {
    const { oilyScalp, dryScalp, highPorosity, lowPorosity, needsProtein, stylingMethod, isScalpOilyWithDryEnds, damageLevel, fineDensity, proteinFrequencyWeeks } = profile;
    const shampoo = oilyScalp ? 'Shampoo equilibrante aplicado solo en la raíz. No llevar a las puntas.' : dryScalp ? 'Shampoo nutritivo suave con masaje circular en cuero cabelludo' : 'Shampoo hidratante con movimientos circulares suaves en raíz';
    const conditioner = lowPorosity ? 'Acondicionador ligero (medios → puntas), dejar 3 min con agua tibia para activar absorción' : highPorosity ? 'Acondicionador nutritivo (todo el largo), enjuagar con agua fría para sellar la cutícula' : 'Acondicionador nutritivo (medios y puntas), enjuague templado';
    const treatment = damageLevel === 'Alto' ? 'Mascarilla reparadora con proteínas o bond builders (1x por semana)' : damageLevel === 'Moderado-Alto' ? 'Mascarilla proteica ligera cada 2 semanas + mascarilla hidratante la otra semana' : needsProtein ? 'Alternar: mascarilla proteica cada 3-4 semanas con mascarilla hidratante las demás' : 'Mascarilla hidratante profunda cada 1-2 semanas';
    let leaveIn;
    if (stylingMethod === 'LOC') leaveIn = fineDensity ? 'L: Leave-in ligero → O: Aceite en puntas (1-2 gotas) → C: Crema ligera de peinar' : 'L: Leave-in → O: Aceite sellador en puntas → C: Crema de peinar para definir rizos';
    else if (stylingMethod === 'LCO') leaveIn = 'L: Leave-in → C: Crema de peinar para definir → O: Aceite ligero para sellar';
    else leaveIn = oilyScalp ? 'Leave-in muy ligero solo en puntas, evitar acercarse a la raíz' : 'Leave-in nutritivo en medios y puntas';
    const oil = isScalpOilyWithDryEnds ? 'Aceite solo en puntas y medios (zona tratada). No tocar raíz.' : oilyScalp ? 'Aceite ultra ligero únicamente en puntas (máx. 2 gotas)' : 'Aceite nutritivo para sellar la hidratación en medios y puntas';
    const steps = [
      { label: 'Shampoo', value: shampoo },
      { label: 'Acondicionador', value: conditioner },
      { label: 'Tratamiento', value: treatment },
      { label: stylingMethod ? `Método ${stylingMethod}` : 'Leave-in', value: leaveIn },
      { label: 'Aceite sellador', value: oil },
    ];
    if (needsProtein) steps.push({ label: 'Frecuencia proteica', value: `Tratamiento proteico cada ${proteinFrequencyWeeks} semanas. Siempre seguir con mascarilla hidratante.` });
    return steps;
  };

  const getPersonalizedTips = (profile) => {
    const tips = [];
    const { oilyScalp, dryScalp, highPorosity, lowPorosity, isChemical, isHeatDamaged, needsProtein, isScalpOilyWithDryEnds, isCurlyOrWavy, fineDensity, damageLevel, stylingMethod } = profile;
    if (isScalpOilyWithDryEnds) tips.push({ title: 'Tratamiento por zonas', description: 'Tu raíz produce exceso de sebo pero las puntas están secas o dañadas. Aplica el shampoo solo en la raíz y el acondicionador/mascarilla solo en medios y puntas. Los aceites pesados en la raíz agravan la oleosidad.' });
    if (isCurlyOrWavy && fineDensity) tips.push({ title: 'Espumas sobre cremas pesadas', description: 'Tu cabello fino y rizado necesita definición sin peso. Las mousses y espumas ligeras definen sin aplanar el rizo. Las cremas muy pesadas o el exceso de aceite pueden quitar volumen.' });
    if (isChemical && dryScalp) tips.push({ title: 'Reparación sin agravar la sequedad', description: 'El proceso químico combinado con cuero cabelludo seco requiere bond builders (como Olaplex) que reparan sin resecar. Lava máximo 2 veces por semana con shampoo ultra suave libre de sulfatos.' });
    if (oilyScalp && !isScalpOilyWithDryEnds) tips.push({ title: 'Limpieza selectiva en raíz', description: 'Aplica el shampoo exclusivamente en el cuero cabelludo, sin frotar el largo. Lavar las puntas con frecuencia las reseca y aumenta la producción de sebo. Termina con agua fría para cerrar los poros.' });
    if (highPorosity) tips.push({ title: 'Sella la cutícula abierta', description: 'La porosidad alta indica cutículas levantadas que pierden humedad fácilmente. Termina siempre con agua fría, aplica aceite después del leave-in para sellar, y evita agua caliente que abre más la cutícula.' });
    if (lowPorosity) tips.push({ title: 'Activa la absorción con calor suave', description: 'La porosidad baja resiste la entrada de productos. Aplica tratamientos con el cabello húmedo y cálido (gorro de vapor o toalla tibia), dejando actuar más tiempo. El calor suave abre la cutícula temporalmente.' });
    if (needsProtein) tips.push({ title: 'Balance proteína / hidratación', description: 'Si el cabello se siente rígido o crujiente, es exceso de proteína; si se estira sin volver y se rompe fácil, falta proteína. Siempre sigue un tratamiento proteico con una mascarilla hidratante.' });
    if (isCurlyOrWavy && stylingMethod) tips.push({ title: `Método ${stylingMethod} para tus rizos`, description: stylingMethod === 'LOC' ? 'Alta porosidad → LOC: Leave-in (hidratación) → Oil (sella antes de que se evapore) → Cream (define). El aceite entre capas protege la humedad del leave-in.' : 'Porosidad media → LCO: Leave-in → Cream (define y penetra mejor) → Oil (sella al final). La crema funciona mejor sobre el leave-in antes del aceite en tu tipo de porosidad.' });
    if (damageLevel === 'Alto') tips.push({ title: 'Reconstrucción progresiva', description: 'Con daño alto, los tratamientos reparadores semanales son esenciales durante al menos 4-6 semanas. Evita el calor directo y usa difusor a temperatura baja si necesitas secar.' });
    else if (isHeatDamaged) tips.push({ title: 'Protección térmica siempre', description: 'Aplica siempre un protector térmico antes de cualquier herramienta con calor. Usa temperatura máxima de 180°C y no repases la misma sección más de dos veces.' });
    else if (damageLevel === 'Bajo') tips.push({ title: 'Mantén la salud sin sobretratar', description: 'Tu cabello está en buen estado. Elige productos ligeros y evita acumular tratamientos innecesarios. Una rutina simple y consistente es más efectiva que muchos productos.' });
    return tips.slice(0, 5);
  };

  const getFrequencyRecommendations = (profile) => {
    const { oilyScalp, dryScalp, highPorosity, lowPorosity, needsProtein, proteinFrequencyWeeks, damageLevel } = profile;
    const washFreq = oilyScalp ? '2-3 veces/semana en raíz. Puntas: shampoo 1 vez/semana.' : dryScalp ? '1-2 veces por semana máximo' : '2 veces por semana';
    const treatmentFreq = damageLevel === 'Alto' ? 'Mascarilla reparadora 1 vez por semana' : damageLevel === 'Moderado-Alto' ? 'Mascarilla 1 vez/semana, profunda cada 2 semanas' : damageLevel === 'Moderado' ? 'Mascarilla hidratante cada 10-14 días' : 'Mascarilla hidratante 2 veces al mes';
    const hydrationFreq = highPorosity ? '2 veces por semana (retiene poca hidratación)' : lowPorosity ? '1 vez por semana (absorción lenta)' : '1-2 veces por semana según el cabello';
    const result = [
      { label: 'Lavado', value: washFreq },
      { label: 'Tratamiento / Mascarilla', value: treatmentFreq },
      { label: 'Hidratación profunda', value: hydrationFreq },
    ];
    if (needsProtein) result.push({ label: 'Tratamiento proteico', value: `Cada ${proteinFrequencyWeeks} semanas. Siempre seguir con mascarilla hidratante.` });
    return result;
  };

  const generateResult = (answersObject) => {
    const profile = buildHairProfile(answersObject);
    const { damageLevel, stylingMethod } = profile;
    const recommendedProducts = getRecommendedProducts(profile);
    const routinePlanResult = getRoutinePlan(profile);
    setRoutinePlan(routinePlanResult);
    setResult({
      hairType: getHairType(answersObject),
      objective: getObjectiveLabel(answersObject.objective),
      porosity: getPorosity(answersObject.porosity),
      density: answersObject.density,
      scalpCondition: getScalpCondition(answersObject.scalp),
      damageLevel,
      stylingMethod,
      recommendations: {
        routine: getRoutineSteps(profile),
        products: recommendedProducts,
        productsByCategory: getCategorizedProducts(recommendedProducts),
        tips: getPersonalizedTips(profile),
        frequency: getFrequencyRecommendations(profile),
      },
    });
  };

  const handleReset = () => {
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    setImage(null);
  };

  // ── RESULT SCREEN ────────────────────────────────────────────────────────────

  if (result) {
    const damageColor =
      result.damageLevel === 'Alto' ? '#E07A7A' :
      result.damageLevel === 'Moderado-Alto' ? '#E8956A' :
      result.damageLevel === 'Moderado' ? '#C4A870' : '#7AAE7A';

    return (
      <View style={styles.screen}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        <LinearGradient
  colors={['#DEB4CC', '#BF789C']} // 👈 este
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0.5 }}
  style={[styles.quizHeader, { paddingTop: insets.top + 14 }]}
>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleReset} style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tu Diagnóstico</Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.resultAvatarSection}>
            <View style={styles.resultIconCircle}>
              <Ionicons name="sparkles" size={26} color="#BF789C" />
            </View>
            <Text style={styles.resultHairType}>{result.hairType}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{result.objective}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
        >
          {image && <Image source={{ uri: image }} style={styles.hairImage} />}

          {/* PERFIL CAPILAR */}
          <View style={[styles.sectionTitleRow, { marginTop: 24 }]}>
            <Ionicons name="analytics-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Perfil capilar</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatChip icon="water-outline" label="Porosidad" value={result.porosity} />
            <StatChip icon="layers-outline" label="Densidad" value={result.density} />
            <StatChip icon="leaf-outline" label="Cuero cabelludo" value={result.scalpCondition} />
            <StatChip icon="alert-circle-outline" label="Nivel de daño" value={result.damageLevel} valueColor={damageColor} />
            {result.stylingMethod && (
              <StatChip icon="color-wand-outline" label="Método" value={`Método ${result.stylingMethod}`} />
            )}
          </View>

          {/* RUTINA */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Rutina recomendada</Text>
          </View>
          <View style={styles.card}>
            {result.recommendations.routine.map((step, i) => (
              <View key={step.label}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.routineRow}>
                  <View style={styles.routineLabelRow}>
                    <View style={styles.routineDot} />
                    <Text style={styles.routineLabel}>{step.label}</Text>
                  </View>
                  <Text style={styles.routineValue}>{step.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* PRODUCTOS */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bag-handle-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Productos sugeridos</Text>
          </View>
          <View style={styles.card}>
            {Object.entries(result.recommendations.productsByCategory).map(([category, prods]) =>
              prods.length > 0 ? (
                <View key={category} style={styles.categoryGroup}>
                  <Text style={styles.categoryHeading}>{category}</Text>
                  {prods.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productRow}
                      onPress={() => Linking.openURL(product.link)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.productRowName} numberOfLines={1}>{product.name}</Text>
                      <View style={styles.productRowTag}>
                        <Text style={styles.productRowTagText}>Ver</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null
            )}
          </View>

          {/* TIPS */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Tips personalizados</Text>
          </View>
          {result.recommendations.tips.map((tip, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tipCard}
              onPress={() => navigation.navigate('TipDetail', { title: tip.title, description: tip.description })}
              activeOpacity={0.85}
            >
              <View style={styles.tipCardTop}>
                <View style={styles.tipDot} />
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D6A4A4" />
              </View>
              <Text style={styles.tipPreview} numberOfLines={2}>{tip.description}</Text>
            </TouchableOpacity>
          ))}

          {/* FRECUENCIA */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Frecuencia de uso</Text>
          </View>
          <View style={styles.card}>
            {result.recommendations.frequency.map((item, i) => (
              <View key={item.label}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.frequencyRow}>
                  <Text style={styles.frequencyLabel}>{item.label}</Text>
                  <Text style={styles.frequencyValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* BOTONES */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Calendario', { screen: 'CalendarMain', params: { routinePlan, objective: result.objective } })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Ver rutina en calendario</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Nuevo diagnóstico</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── QUIZ SCREEN ──────────────────────────────────────────────────────────────

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
       colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.quizHeader, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{currentQuestion + 1} / {questions.length}</Text>
          </View>
          <Text style={styles.headerTitle}>Diagnóstico Capilar</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={questions}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => {
          const selected = answers[item.id];
          return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.slideContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.stepLabel}>
                  {item.id === 'photo' ? 'Paso final · Opcional' : `Pregunta ${index + 1} de ${questions.length}`}
                </Text>
                <Text style={styles.question}>{item.title}</Text>

                {item.id === 'photo' ? (
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage} activeOpacity={0.85}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.uploadImage} />
                    ) : (
                      <>
                        <View style={styles.uploadIconWrap}>
                          <Ionicons name="camera-outline" size={34} color="#D6A4A4" />
                        </View>
                        <Text style={styles.uploadText}>Subir foto de tu cabello</Text>
                        <Text style={styles.uploadSubText}>Toca para seleccionar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.optionsContainer}>
                    {item.options.map((option) => {
                      const isActive = selected === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.optionCard, isActive && styles.optionCardActive]}
                          activeOpacity={0.85}
                          onPress={() => handleSelectOption(item.id, option.value)}
                        >
                         {isActive && (
                          <LinearGradient
                            colors={["#D6A4A4", "#BF789C"]} // ✅ mismo que comprar
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                          <View style={styles.optionCardInner}>
                            <View style={[styles.optionRadio, isActive && styles.optionRadioActive]}>
                              {isActive && <View style={styles.optionRadioDot} />}
                            </View>
                            <View style={styles.optionTextBlock}>
                              <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
                                {option.title}
                              </Text>
                              <Text style={[styles.optionDesc, isActive && styles.optionDescActive]}>
                                {option.desc}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          );
        }}
      />

      <View style={[styles.nextContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={!selectedAnswer && !isLastQuestion}
        >
          <LinearGradient
  colors={!selectedAnswer && !isLastQuestion 
    ? ['#E2C8D4', '#CCB0C0'] 
    : ["#D6A4A4", "#BF789C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextText}>
              {isLastQuestion ? 'Ver mi diagnóstico' : 'Siguiente'}
            </Text>
            <Ionicons
              name={isLastQuestion ? 'sparkles-outline' : 'arrow-forward'}
              size={18}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // shared header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // quiz header extras
  quizHeader: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  stepPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  stepPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressBar: {
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#fff',
  },

  // quiz slide
  slide: {
    flex: 1,
  },
  slideContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 130,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 24,
    lineHeight: 30,
  },

  // option cards
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
    optionCardActive: {
    borderColor: '#BF789C',
    overflow: 'hidden',
    backgroundColor: 'transparent', // 🔥 clave para que el gradient se vea bien
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  optionRadioActive: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#fff',
  },
  optionDesc: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
  },
  optionDescActive: {
    color: 'rgba(255,255,255,0.85)',
  },

  // photo upload
  uploadButton: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F0DDE2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  uploadImage: {
    width: '100%',
    height: '100%',
  },

  // next button
  nextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // result header avatar area
  resultAvatarSection: {
    alignItems: 'center',
  },
  resultIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultHairType: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // scroll / sections
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statChip: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  statChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCC',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    lineHeight: 18,
  },

  // hair image
  hairImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 8,
    resizeMode: 'cover',
  },

  // card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 28,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5E8EC',
  },

  // routine
  routineRow: {
    paddingVertical: 14,
  },
  routineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  routineLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  routineValue: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    paddingLeft: 15,
  },

  // products
  categoryGroup: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  categoryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  productRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productRowTag: {
    backgroundColor: '#FDF0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  productRowTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
  },

  // tips
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  tipCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  tipTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  tipPreview: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
    paddingLeft: 18,
  },

  // frequency
  frequencyRow: {
    paddingVertical: 13,
    gap: 4,
  },
  frequencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  frequencyValue: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
  },

  // action buttons
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 14,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D6A4A4',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#D6A4A4',
    fontWeight: '700',
    fontSize: 15,
  },
});
