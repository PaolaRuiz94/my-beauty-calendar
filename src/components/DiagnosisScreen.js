import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';
import YoutubeIframe from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productDB, recommendationDB } from '../data/products';
import { fetchRoutineVideos } from '../firebase/videos';
import { searchYouTubeVideos } from '../services/youtube';
import YouTubeCarousel from './YouTubeCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_CARD_WIDTH = SCREEN_WIDTH - 48;
const MODAL_VIDEO_HEIGHT = Math.round(MODAL_CARD_WIDTH * 9 / 16);

const STEP_TO_KEY = {
  shampoo: 'lavado',
  acondicionador: 'lavado',
  tratamiento: 'tratamiento',
  'leave-in': 'definicion',
  'gel definidor': 'definicion',
  'aceite sellador': 'secado',
};

function getStepVideoKey(label, texture) {
  if (!label || !texture) return null;
  const lower = label.toLowerCase();
  const stepKey = lower.startsWith('método') ? 'definicion' : STEP_TO_KEY[lower];
  return stepKey ? `${texture.toLowerCase()}_${stepKey}` : null;
}

// Opciones de subtipo de rizo filtradas por textura
const CURL_TYPE_OPTIONS = {
  Ondulado: [
    { value: '2A', title: '2A — Ondulado sutil', desc: 'Ondas suaves que tienden a desaparecer con humedad o peso.' },
    { value: '2B', title: '2B — Ondulado definido', desc: 'Ondas en S con volumen y resistencia al aplastarse.' },
    { value: '2C', title: '2C — Ondulado pronunciado', desc: 'Ondas marcadas que rozan el rizo, con volumen notorio.' },
  ],
  Rizado: [
    { value: '3A', title: '3A — Rizo amplio', desc: 'Rizos grandes y brillosos, fáciles de definir.' },
    { value: '3B', title: '3B — Rizo mediano', desc: 'Rizos compactos y elásticos con buen rebote.' },
    { value: '3C', title: '3C — Rizo apretado', desc: 'Rizos pequeños y densos, mucha retracción al secar.' },
  ],
  Coily: [
    { value: '4A', title: '4A — Coily suave', desc: 'Espirales apretadas con patrón S visible y algo de brillo.' },
    { value: '4B', title: '4B — Coily angular', desc: 'Patrón en Z o zig-zag, gran retracción y volumen.' },
    { value: '4C', title: '4C — Coily denso', desc: 'Patrón muy apretado, poca definición visible, máxima retracción.' },
  ],
};

const questions = [
  // Módulo 1 — Textura y patrón
  {
    id: 'texture',
    title: '¿Cuál es tu textura de cabello?',
    options: [
      { value: 'Lacio', title: 'Lacio', desc: 'Textura suave y lineal, sin rizos ni ondas.' },
      { value: 'Ondulado', title: 'Ondulado', desc: 'Movimiento natural con ondas que van de sutiles a pronunciadas.' },
      { value: 'Rizado', title: 'Rizado', desc: 'Rizos definidos, desde amplios hasta pequeños y apretados.' },
      { value: 'Coily', title: 'Afrorizado', desc: 'Patrón muy apretado con espirales o zig-zag, máxima retracción.' },
      { value: 'Transición', title: 'Transición capilar', desc: 'Cabello que mezcla zona natural nueva y zona con proceso químico anterior.' },
    ],
  },
  {
    id: 'curlType',
    title: 'Identifica tu subtipo de rizo',
    conditional: true,
    options: [], // se llena dinámicamente según textura
  },
  // Módulo 2 — Estructura
  {
    id: 'strandThickness',
    title: '¿Cómo es el grosor de cada mechón?',
    options: [
      { value: 'Fino', title: 'Fino', desc: 'Casi no se siente entre los dedos, parece transparente a la luz.' },
      { value: 'Medio', title: 'Medio', desc: 'Se siente claramente pero sin rigidez.' },
      { value: 'Grueso', title: 'Grueso / Coarse', desc: 'Robusto y resistente, casi como un hilo de coser.' },
    ],
  },
  {
    id: 'density',
    title: '¿Cuánto cabello tienes en total?',
    options: [
      { value: 'Escasa', title: 'Escasa', desc: 'Se ve el cuero cabelludo con facilidad.' },
      { value: 'Media', title: 'Media', desc: 'Ni demasiado poco ni demasiado.' },
      { value: 'Abundante', title: 'Abundante', desc: 'Mucho volumen, tarda en secar por dentro.' },
    ],
  },
  // Módulo 3 — Cuero cabelludo
  {
    id: 'scalp',
    title: '¿Cómo describirías tu cuero cabelludo?',
    options: [
      { value: 'Grasa', title: 'Graso', desc: 'Brillo y peso en la raíz al final del día.' },
      { value: 'Normal', title: 'Equilibrado', desc: 'Se mantiene fresco y con balance natural.' },
      { value: 'Seco', title: 'Seco', desc: 'Se siente tirante y puede picar.' },
    ],
  },
  {
    id: 'scalpIssues',
    title: '¿Tienes alguno de estos problemas?',
    multiSelect: true,
    options: [
      { value: 'caspa', title: 'Caspa / descamación', desc: 'Escamas blancas o amarillentas visibles.' },
      { value: 'picazon', title: 'Picazón o sensibilidad', desc: 'Cuero cabelludo irritado o reactivo.' },
      { value: 'caida', title: 'Caída excesiva', desc: 'Pérdida notoria al peinar o en la ducha.' },
      { value: 'ninguno', title: 'Ninguno', desc: 'Sin problemas específicos.' },
    ],
  },
  // Módulo 4 — Comportamiento
  {
    id: 'porosity',
    title: '¿Cómo absorbe tu cabello el agua?',
    options: [
      { value: 'Alta', title: 'Alta porosidad', desc: 'Absorbe rápido pero pierde hidratación fácilmente.' },
      { value: 'Media', title: 'Porosidad media', desc: 'Buena absorción y retención cuando está bien cuidado.' },
      { value: 'Baja', title: 'Baja porosidad', desc: 'Los productos tardan en penetrar y se acumulan.' },
    ],
  },
  {
    id: 'elasticity',
    title: '¿Qué pasa cuando estiras un mechón mojado?',
    options: [
      { value: 'Alta', title: 'Se estira bien', desc: 'Se alarga y regresa a su forma sin romperse.' },
      { value: 'Normal', title: 'Estiramiento normal', desc: 'Algo de estiramiento antes de romperse con fuerza.' },
      { value: 'Baja', title: 'Se rompe rápido', desc: 'Poca elasticidad, se quiebra sin casi estirarse.' },
    ],
  },
  // Módulo 5 — Historial
  {
    id: 'chemical',
    title: '¿Tu cabello tiene algún proceso químico?',
    options: [
      { value: 'Natural', title: 'Natural', desc: 'Sin procesos químicos de ningún tipo.' },
      { value: 'Color', title: 'Color / tinte', desc: 'Tinte parcial o completo, reciente o acumulado.' },
      { value: 'Alisado', title: 'Alisado / keratina', desc: 'Alisado permanente o tratamiento de keratina.' },
      { value: 'Calor', title: 'Solo calor', desc: 'Natural pero con uso frecuente de herramientas.' },
      { value: 'Varios', title: 'Varios procesos', desc: 'Combinación de color, alisado u otros tratamientos.' },
    ],
  },
  {
    id: 'heatFrequency',
    title: '¿Con qué frecuencia usas herramientas de calor?',
    options: [
      { value: 'Nunca', title: 'Nunca', desc: 'No uso plancha, secador ni rizador con calor.' },
      { value: 'Ocasional', title: 'Ocasional', desc: '1 a 2 veces por semana.' },
      { value: 'Frecuente', title: 'Frecuente', desc: '3 o más veces por semana.' },
    ],
  },
  // Módulo 6 — Longitud y objetivo
  {
    id: 'length',
    title: '¿Cuál es la longitud de tu cabello?',
    options: [
      { value: 'Corto', title: 'Corto', desc: 'Hasta cuello o hombros.' },
      { value: 'Medio', title: 'Medio', desc: 'Entre hombros y pecho.' },
      { value: 'Largo', title: 'Largo', desc: 'Debajo del pecho.' },
    ],
  },
  {
    id: 'objective',
    title: '¿Cuál es tu objetivo capilar principal?',
    options: [
      { value: 'crecimiento', title: 'Crecimiento', desc: 'Apoya el crecimiento y la fortaleza del cabello.' },
      { value: 'hidratación', title: 'Hidratación', desc: 'Aporta suavidad y flexibilidad a la fibra.' },
      { value: 'reparación', title: 'Reparación', desc: 'Repara el cabello dañado por procesos o calor.' },
      { value: 'definición', title: 'Definición', desc: 'Mejora la forma y el rebote de tus rizos u ondas.' },
      { value: 'volumen', title: 'Volumen', desc: 'Aporta cuerpo y movimiento ligero.' },
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [routinePlan, setRoutinePlan] = useState([]);
  const [image, setImage] = useState(null);
  const [videoModal, setVideoModal] = useState({ visible: false, label: '', value: '', videos: [], isLoadingVideos: false });
  const [routineVideos, setRoutineVideos] = useState({});
  const flatListRef = useRef(null);
  const videoRef = useRef(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRoutineVideos()
      .then(setRoutineVideos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.multiGet([
      '@mybeauty-calendar:diagnosisResult',
      '@mybeauty-calendar:diagnosisRoutinePlan',
    ]).then(([[, savedResult], [, savedPlan]]) => {
      if (savedResult) setResult(JSON.parse(savedResult));
      if (savedPlan) setRoutinePlan(JSON.parse(savedPlan));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoadingDiagnosis) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isLoadingDiagnosis, spinAnim]);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const currentQ = questions[currentQuestion];
  const rawAnswer = answers[currentQ.id];
  const hasCurrentAnswer = currentQ.id === 'photo'
    ? true
    : currentQ.multiSelect
    ? Array.isArray(rawAnswer) && rawAnswer.length > 0
    : !!rawAnswer;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { alert('Permiso requerido'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const handleSelectOption = (questionId, value) => {
    const q = questions.find(item => item.id === questionId);
    if (q?.multiSelect) {
      setAnswers(prev => {
        const curr = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        if (value === 'ninguno') return { ...prev, [questionId]: ['ninguno'] };
        const withoutNinguno = curr.filter(v => v !== 'ninguno');
        return {
          ...prev,
          [questionId]: withoutNinguno.includes(value)
            ? withoutNinguno.filter(v => v !== value)
            : [...withoutNinguno, value],
        };
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleNext = () => {
    if (!hasCurrentAnswer) return;
    let next = currentQuestion + 1;
    // Saltar curlType para Lacio y Transición (no tienen subtipo de rizo)
    if (next < questions.length && questions[next].id === 'curlType') {
      if (answers.texture === 'Lacio' || answers.texture === 'Transición') {
        next++;
      }
    }
    if (next >= questions.length) {
      generateResult({ ...answers });
      return;
    }
    setCurrentQuestion(next);
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const handleBack = () => {
    let prev = currentQuestion - 1;
    // Saltar curlType al retroceder si es necesario
    if (prev >= 0 && questions[prev].id === 'curlType') {
      if (answers.texture === 'Lacio' || answers.texture === 'Transición') {
        prev--;
      }
    }
    if (prev >= 0) {
      setCurrentQuestion(prev);
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
    }
  };

  const handleSwipeGesture = (event) => {
    const { nativeEvent } = event;
    // Detectar swipe hacia la derecha al finalizar el gesto
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 50 && Math.abs(nativeEvent.velocityX) > Math.abs(nativeEvent.velocityY)) {
        handleBack();
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentQuestion(viewableItems[0].index);
    }
  }).current;

  // ── Lógica de diagnóstico ─────────────────────────────────────────────────────

  const getScalpCondition = (v) =>
    v === 'Grasa' ? 'Cuero cabelludo graso' : v === 'Seco' ? 'Cuero cabelludo seco' : 'Cuero cabelludo equilibrado';

  const getPorosity = (v) => (v === 'Alta' ? 'Alta' : v === 'Baja' ? 'Baja' : 'Media');

  const buildHairProfile = (answersObject) => {
    const {
      scalp, porosity, density, chemical, texture, objective,
      curlType, strandThickness, elasticity, scalpIssues,
      heatFrequency, length,
    } = answersObject;

    const isLacio = texture === 'Lacio';
    const isOndulado = texture === 'Ondulado';
    const isRizado = texture === 'Rizado';
    const isCoily = texture === 'Coily';
    const isTransicion = texture === 'Transición';
    const isCurly = isRizado || isCoily;
    const isWavy = isOndulado;
    const isCurlyOrWavy = isCurly || isWavy || isTransicion;

    const fineStrand = strandThickness === 'Fino';
    const coarseStrand = strandThickness === 'Grueso';
    const lowDensity = density === 'Escasa';
    const highDensity = density === 'Abundante';
    const fineDensity = lowDensity; // alias de compatibilidad
    const denseDensity = highDensity; // alias para productos con perfil de densidad alta

    const isColor = chemical === 'Color';
    const isAlisado = chemical === 'Alisado';
    const isVarios = chemical === 'Varios';
    const isChemical = isColor || isAlisado || isVarios;
    const isHeatDamaged = chemical === 'Calor' || heatFrequency === 'Frecuente';

    const lowElasticity = elasticity === 'Baja';

    const scalpIssuesList = Array.isArray(scalpIssues) ? scalpIssues : [];
    const hasDandruff = scalpIssuesList.includes('caspa');
    const hasSensitivity = scalpIssuesList.includes('picazon');
    const hasHairLoss = scalpIssuesList.includes('caida');

    const highPorosity = porosity === 'Alta';
    const lowPorosity = porosity === 'Baja';
    const oilyScalp = scalp === 'Grasa';
    const dryScalp = scalp === 'Seco';

    const needsProtein = isChemical || isHeatDamaged || lowElasticity;
    const needsClarifying = oilyScalp || lowPorosity || hasDandruff;
    const isScalpOilyWithDryEnds = oilyScalp && (highPorosity || isChemical);
    const stylingMethod = isCurlyOrWavy ? (highPorosity ? 'LOC' : 'LCO') : null;

    const proteinFrequencyWeeks = (isAlisado || isVarios) ? 2
      : isColor ? 3
      : isHeatDamaged || lowElasticity ? 2
      : 4;

    let damageLevel;
    if ((isAlisado || isVarios) && (highPorosity || lowElasticity)) damageLevel = 'Alto';
    else if (isAlisado || isVarios || (isColor && highPorosity)) damageLevel = 'Moderado-Alto';
    else if (isColor || (isHeatDamaged && highPorosity) || lowElasticity) damageLevel = 'Moderado';
    else damageLevel = 'Bajo';

    const isShort = length === 'Corto';
    const isLong = length === 'Largo';

    return {
      scalp, porosity, density, chemical, texture, objective,
      curlType, strandThickness, elasticity, scalpIssues: scalpIssuesList,
      heatFrequency, length,
      isLacio, isOndulado, isRizado, isCoily, isTransicion,
      isCurly, isWavy, isCurlyOrWavy,
      fineStrand, coarseStrand, lowDensity, highDensity, fineDensity,
      isColor, isAlisado, isVarios, isChemical, isHeatDamaged,
      lowElasticity,
      hasDandruff, hasSensitivity, hasHairLoss,
      highPorosity, lowPorosity, oilyScalp, dryScalp,
      needsProtein, needsClarifying, isScalpOilyWithDryEnds,
      stylingMethod, proteinFrequencyWeeks, damageLevel,
      isShort, isLong, denseDensity,
    };
  };

  const getHairType = (answersObject) => {
    const { texture, curlType, strandThickness, chemical } = answersObject;
    const curlSuffix = curlType ? ` ${curlType}` : '';
    const thicknessLabel = strandThickness === 'Fino' ? 'fino'
      : strandThickness === 'Grueso' ? 'grueso' : 'medio';
    const treatedLabel = chemical === 'Natural' ? 'natural'
      : chemical === 'Calor' ? 'natural c/ calor' : 'tratado';
    const base = texture === 'Transición' ? 'Transición capilar' : texture;
    return `${base}${curlSuffix} ${thicknessLabel} / ${treatedLabel}`;
  };

  const getObjectiveLabel = (value) => {
    const map = {
      crecimiento: 'Crecimiento', hidratación: 'Hidratación',
      reparación: 'Reparación', definición: 'Definición', volumen: 'Volumen',
    };
    return map[value] || 'Objetivo personalizado';
  };

  const getRoutinePlan = (profile, products = []) => {
    const byCategory = {};
    products.forEach(p => { byCategory[p.category] = p; });
    const tag = (text, category) => {
      const p = byCategory[category];
      return p ? `${text} — ${p.brand} ${p.name}` : text;
    };
    const tagGelOrMousse = (text) => {
      const p = byCategory['Gel'] || byCategory['Espumas'];
      return p ? `${text} — ${p.brand} ${p.name}` : text;
    };
    const {
      isCurly, isWavy, isCurlyOrWavy, isCoily, isTransicion, objective,
      oilyScalp, dryScalp, highPorosity, needsProtein, isChemical, isHeatDamaged,
      damageLevel, fineStrand, hasDandruff, hasHairLoss,
    } = profile;

    const detoxShampoo = tag(
      hasDandruff ? 'Shampoo anticaspa clarificante (zinc o ketoconazol) en cuero cabelludo'
      : oilyScalp  ? 'Shampoo clarificante (detox) solo en raíz para resetear el cabello'
                   : 'Shampoo clarificante (detox) para resetear el cabello',
      'Shampoo'
    );

    const hydraShampoo = tag(
      hasDandruff ? 'Shampoo anticaspa suave + masaje circular (alterna con clarificante)'
      : oilyScalp  ? 'Shampoo equilibrante solo en la raíz'
      : dryScalp   ? 'Shampoo nutritivo suave con masaje circular en cuero cabelludo'
                   : 'Shampoo hidratante (sin frotar medios ni puntas)',
      'Shampoo'
    );

    const deepTreatment = tag(
      objective === 'reparación' || damageLevel === 'Alto'
        ? 'Mascarilla reparadora profunda con bond builders (20-30 min)'
        : objective === 'hidratación' || highPorosity || isCoily
        ? 'Mascarilla hidratante profunda (15-20 min bajo gorro de vapor)'
        : objective === 'volumen'
        ? 'Mascarilla voluminizadora ligera (10 min)'
        : 'Mascarilla nutritiva (15 min)',
      'Tratamiento'
    );

    const conditioner = tag(
      highPorosity
        ? 'Acondicionador nutritivo (todo el largo) — enjuague con agua fría'
        : 'Acondicionador en medios y puntas — enjuague templado',
      'Acondicionador'
    );

    const tonico = hasHairLoss
      ? 'Tónico estimulante (cafeína o biotina) con masaje de 5 min en cuero cabelludo'
      : objective === 'crecimiento'
      ? 'Tónico capilar estimulante (cafeína o biotina) en cuero cabelludo'
      : oilyScalp
      ? 'Tónico equilibrante en cuero cabelludo'
      : dryScalp
      ? 'Tónico nutritivo en cuero cabelludo'
      : 'Tónico capilar fortalecedor en cuero cabelludo';

    const stylingDaySteps = (isCurly || isCoily)
      ? [
          tag(
            isCoily
              ? 'Crema de peinar densa en cabello muy húmedo por secciones (praying hands o shingling)'
              : 'Crema de peinar en cabello húmedo (medios → puntas, scrunch)',
            'Crema de Peinar'
          ),
          tagGelOrMousse(
            fineStrand
              ? 'Espuma o gel ligero para rizos (scrunch suave, no presionar)'
              : isCoily
              ? 'Gel fuerte o manteca de styling sobre la crema (sellar y definir)'
              : 'Gel para definir y fijar rizos (scrunch)'
          ),
        ]
      : isWavy
      ? [tag('Leave-in ligero o crema suave (medios y puntas)', 'Crema de Peinar'), tagGelOrMousse('Espuma o gel ligero para ondas (scrunch)')]
      : isTransicion
      ? [tag('Leave-in hidratante en zona de raíz natural', 'Crema de Peinar'), tag('Crema de peinar ligera en puntas para unificar textura', 'Crema de Peinar')]
      : [tag('Leave-in ligero o sérum (medios y puntas)', 'Crema de Peinar')];

    const refreshDaySteps = (isCurly || isCoily)
      ? ['Spray de agua + crema ligera para reactivar rizos (scrunch)', tagGelOrMousse('Gel o mousse para sellar y refrescar'), tag('Aceite ligero en puntas', 'Aceites')]
      : isWavy
      ? ['Spray refrescante + espuma ligera en cabello húmedo', tag('Aceite ligero en puntas', 'Aceites')]
      : isTransicion
      ? ['Spray de agua en zona natural para rehidratar', tag('Aceite ligero en puntas tratadas', 'Aceites')]
      : ['Shampoo en seco en raíz si es necesario', tag('Aceite ligero solo en puntas', 'Aceites')];

    const nightOil = tag(
      isChemical || damageLevel === 'Alto'
        ? 'Aceite reparador (argán o queratina) solo en puntas'
        : highPorosity
        ? 'Aceite nutritivo sellador (coco o argán) en medios y puntas'
        : isHeatDamaged
        ? 'Aceite reparador ligero en puntas'
        : oilyScalp
        ? 'Aceite ultra ligero solo en puntas (máx. 2 gotas)'
        : 'Aceite nutritivo ligero en puntas',
      'Aceites'
    );

    const nightSteps = ['Gorro de seda o pañuelo de satín (protege del roce al dormir)', tonico, nightOil];

    const plan3DaySteps = needsProtein
      ? [
          tag('Pre-poo: aceite en medios y puntas (15 min antes)', 'Aceites'),
          tag(`Tratamiento proteico (dejar actuar ${isChemical ? '20' : '30'} min)`, 'Tratamiento'),
          tag('Acondicionador hidratante para equilibrar proteína', 'Acondicionador'),
          ...stylingDaySteps,
        ]
      : [tag('Aceite ligero en puntas', 'Aceites'), isCurlyOrWavy ? tagGelOrMousse('Crema o mousse para mantener la forma') : tag('Leave-in suave si es necesario', 'Crema de Peinar')];

    return [
      { day: 1, title: 'Lavado detox + reinicio', daySteps: [detoxShampoo, deepTreatment, conditioner, ...stylingDaySteps], nightSteps },
      { day: 2, title: isCurlyOrWavy ? 'Refresco y activación' : 'Mantenimiento ligero', daySteps: refreshDaySteps, nightSteps },
      { day: 3, title: 'Lavado hidratante', daySteps: [hydraShampoo, conditioner, ...stylingDaySteps], nightSteps },
      { day: 4, title: needsProtein ? 'Tratamiento proteico' : 'Cuidado suave', daySteps: plan3DaySteps, nightSteps },
    ];
  };

  const getRecommendedProducts = (profile) => {
    const categoryEntries = Object.entries(productDB);
    const allProducts = categoryEntries.flatMap(([category, products]) => products.map((product) => ({ category, product })));

    const normalize = (value) => String(value || '').toLowerCase();
    const hasTag = (product, tag) => (product.tags || []).some((t) => normalize(t).includes(tag));
    const matchesAnyTag = (product, tags) => tags.some((tag) => hasTag(product, tag));

    const scoreProduct = ({ product, category }) => {
      let score = 0;
      const tags = (product.tags || []).map(normalize);
      const addIf = (condition, value) => { if (condition) score += value; };

      addIf(profile.isChemical, matchesAnyTag(product, ['reparador', 'daño', 'protección', 'protectora']) ? 2 : 0);
      addIf(profile.isColor, matchesAnyTag(product, ['brillo', 'protección', 'reparador', 'suavidad']) ? 2 : 0);
      addIf(profile.isAlisado, matchesAnyTag(product, ['alisado', 'desenredo', 'ligero', 'suave']) ? 2 : 0);
      addIf(profile.isHeatDamaged, matchesAnyTag(product, ['reparador', 'daño', 'protección', 'suavidad']) ? 2 : 0);
      addIf(profile.oilyScalp || profile.lowPorosity, matchesAnyTag(product, ['clarificante', 'detox', 'limpieza profunda']) ? 3 : 0);
      addIf(profile.oilyScalp, matchesAnyTag(product, ['ligero', 'suave', 'diario', 'clarificante', 'detox']) ? 2 : 0);
      addIf(profile.dryScalp, matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 2 : 0);
      addIf(profile.highPorosity, matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 2 : 0);
      addIf(profile.lowPorosity, matchesAnyTag(product, ['ligero', 'sin peso', 'suave']) ? 2 : 0);
      addIf(profile.needsProtein, matchesAnyTag(product, ['reparador', 'fortalecimiento', 'daño']) ? 2 : 0);
      addIf(profile.lowElasticity, matchesAnyTag(product, ['reparador', 'fortalecimiento', 'daño']) ? 2 : 0);
      addIf(profile.hasDandruff, matchesAnyTag(product, ['suave', 'limpia', 'equilibrio']) ? 1 : 0);
      addIf(profile.hasSensitivity, matchesAnyTag(product, ['suave', 'ligero']) ? 1 : 0);
      addIf(profile.isCurlyOrWavy, matchesAnyTag(product, ['rizos', 'definición', 'anti-frizz', 'fijación', 'control']) ? 2 : 0);
      addIf(profile.fineStrand, matchesAnyTag(product, ['ligero', 'definición', 'suavidad']) ? 1 : 0);
      addIf(profile.coarseStrand, matchesAnyTag(product, ['nutritivo', 'suavidad', 'reparador']) ? 1 : 0);
      addIf(profile.fineDensity, matchesAnyTag(product, ['ligero', 'volumen', 'definición']) ? 1 : 0);
      addIf(profile.highDensity, matchesAnyTag(product, ['ligero', 'volumen', 'nutritivo']) ? 1 : 0);
      addIf(profile.objective === 'hidratación', matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 3 : 0);
      addIf(profile.objective === 'reparación', matchesAnyTag(product, ['reparador', 'daño', 'fortalecimiento']) ? 3 : 0);
      addIf(profile.objective === 'definición', matchesAnyTag(product, ['definición', 'rizos', 'fijación', 'control']) ? 3 : 0);
      addIf(profile.objective === 'volumen', matchesAnyTag(product, ['volumen', 'ligera', 'textura']) ? 3 : 0);
      addIf(profile.objective === 'crecimiento', matchesAnyTag(product, ['suavidad', 'equilibrio', 'ligero']) ? 1 : 0);
      addIf(profile.length === 'Largo', matchesAnyTag(product, ['brillo', 'nutritivo', 'suavidad']) ? 1 : 0);
      addIf(profile.length === 'Corto', matchesAnyTag(product, ['volumen', 'ligero', 'definición']) ? 1 : 0);

      if (category === 'shampoo' && profile.scalp === 'Grasa' && tags.includes('reparador')) score -= 1;
      if ((category === 'cremaDePeinar' || category === 'espumas' || category === 'gel') && profile.texture === 'Lacio') score -= 1;

      const STYLING_CATS = ['cremaDePeinar', 'espumas', 'gel'];
      if (product.weightClass && STYLING_CATS.includes(category)) {
        const needsHeavy = profile.isCoily || profile.isRizado;
        const needsMedium = profile.isOndulado;
        const needsLight = profile.isLacio;
        if (needsHeavy) {
          if (product.weightClass === 'pesado') score += 3;
          else if (product.weightClass === 'medio') score += 1;
          else score -= 3;
        } else if (needsMedium) {
          if (product.weightClass === 'pesado') score += 1;
          else if (product.weightClass === 'medio') score += 2;
          else score -= 1;
        } else if (needsLight) {
          if (product.weightClass === 'ligero') score += 2;
          else if (product.weightClass === 'medio') score += 0;
          else score -= 2;
        }
      }

      return score;
    };

    // Score all products
    const allScored = allProducts.map(entry => ({ ...entry, score: scoreProduct(entry) }));

    // Brand cohesion: find the brand with the best combined routine score across all categories
    const brandCatBest = {};
    allScored.forEach(({ category, product, score }) => {
      const b = product.brand;
      if (!brandCatBest[b]) brandCatBest[b] = {};
      if (!brandCatBest[b][category] || score > brandCatBest[b][category].score) {
        brandCatBest[b][category] = { product, score };
      }
    });
    const brandTotals = {};
    Object.entries(brandCatBest).forEach(([b, cats]) => {
      brandTotals[b] = Object.values(cats).reduce((s, { score }) => s + Math.max(0, score), 0);
    });
    const routineBrand = Object.entries(brandTotals).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Pick the best product per category from the routine brand; fall back to global best
    const globalCatBest = {};
    allScored.sort((a, b) => b.score - a.score).forEach(({ category, product, score }) => {
      if (!globalCatBest[category]) globalCatBest[category] = { product, score };
    });
    const categoryBest = {};
    Object.keys(productDB).forEach(category => {
      const brandEntry = brandCatBest[routineBrand]?.[category];
      if (brandEntry && brandEntry.score > 0) {
        categoryBest[category] = brandEntry;
      } else {
        categoryBest[category] = globalCatBest[category];
      }
    });

    const recommended = Object.keys(productDB).map((category) => {
      const best = categoryBest[category];
      if (best && best.score > 0) return best.product;
      return productDB[category][0];
    });

    return recommended;
  };

  const getCategorizedProducts = (products) => {
    const categoriesMap = new Map();
    // Orden personalizado
    ['Shampoo', 'Tratamiento', 'Acondicionador', 'Crema de Peinar', 'Gel', 'Espumas', 'Aceites'].forEach(cat => categoriesMap.set(cat, []));

    products.forEach((product) => {
      const key = product.category?.trim();
      if (categoriesMap.has(key)) categoriesMap.get(key).push(product);
    });

    // Convertir a objeto manteniendo orden
    return Object.fromEntries(categoriesMap);
  };

  const getRoutineSteps = (profile) => {
    const {
      oilyScalp, dryScalp, highPorosity, lowPorosity, needsProtein,
      stylingMethod, isScalpOilyWithDryEnds, damageLevel, fineDensity,
      proteinFrequencyWeeks, isCurly, isWavy, isCoily, isTransicion,
      hasDandruff, hasSensitivity, fineStrand, coarseStrand, lowElasticity,
    } = profile;

    const shampoo = hasDandruff
      ? 'Shampoo anticaspa (zinc o ketoconazol) en cuero cabelludo — alterna con shampoo suave hidratante'
      : hasSensitivity
      ? 'Shampoo hipoalergénico sin sulfatos ni fragancia, masaje muy suave'
      : oilyScalp
      ? 'Shampoo equilibrante aplicado solo en la raíz. No llevar a las puntas.'
      : dryScalp
      ? 'Shampoo nutritivo suave con masaje circular en cuero cabelludo'
      : 'Shampoo hidratante con movimientos circulares suaves en raíz';

    const conditioner = lowPorosity
      ? 'Acondicionador ligero (medios → puntas), dejar 3 min con agua tibia para activar absorción'
      : highPorosity
      ? 'Acondicionador nutritivo (todo el largo), enjuagar con agua fría para sellar la cutícula'
      : 'Acondicionador nutritivo (medios y puntas), enjuague templado';

    const treatment = damageLevel === 'Alto'
      ? 'Mascarilla reparadora con bond builders o proteínas (1x por semana)'
      : damageLevel === 'Moderado-Alto'
      ? 'Mascarilla proteica ligera cada 2 semanas + mascarilla hidratante la otra semana'
      : needsProtein || lowElasticity
      ? 'Alternar: mascarilla proteica cada 3-4 semanas con mascarilla hidratante las demás'
      : 'Mascarilla hidratante profunda cada 1-2 semanas';

    let leaveIn;
    if (isTransicion) {
      leaveIn = 'Zona de raíz natural: leave-in hidratante ligero. Zona de puntas tratadas: acondicionador sin enjuague nutritivo para equilibrar.';
    } else if (stylingMethod === 'LOC') {
      leaveIn = fineStrand
        ? 'L: Leave-in ligero → O: Aceite en puntas (1-2 gotas) → C: Crema ligera de peinar'
        : 'L: Leave-in → O: Aceite sellador en puntas → C: Crema de peinar para definir';
    } else if (stylingMethod === 'LCO') {
      leaveIn = 'L: Leave-in → C: Crema de peinar para definir → O: Aceite ligero para sellar';
    } else {
      leaveIn = oilyScalp
        ? 'Leave-in muy ligero solo en puntas, evitar acercarse a la raíz'
        : 'Leave-in nutritivo en medios y puntas';
    }

    const oil = isScalpOilyWithDryEnds
      ? 'Aceite solo en puntas y medios (zona tratada). No tocar raíz.'
      : oilyScalp
      ? 'Aceite ultra ligero únicamente en puntas (máx. 2 gotas)'
      : coarseStrand
      ? 'Aceite nutritivo denso (karité o aguacate) en medios y puntas para penetrar la cutícula gruesa'
      : 'Aceite nutritivo para sellar la hidratación en medios y puntas';

    let gel = null;
    if (isTransicion) {
      gel = 'Crema de peinar ligera en zona de raíz natural y gel o espuma en las puntas tratadas para unificar la textura.';
    } else if (isCurly || isCoily) {
      gel = fineDensity
        ? 'Gel ligero para rizos finos sobre cabello húmedo (scrunch suave). Evita frotar para no romper el rizo.'
        : isCoily
        ? 'Gel fuerte o manteca de styling sobre cabello muy húmedo (shingling o praying hands). Deja secar sin tocar.'
        : 'Gel de fijación media-fuerte sobre cabello húmedo (scrunch de puntas a raíz). Deja el cast secar antes de romperlo.';
    } else if (isWavy) {
      gel = 'Gel ligero o espuma sobre cabello húmedo para definir ondas sin pesarlas (scrunch suave).';
    }

    const steps = [
      { label: 'Shampoo', value: shampoo },
      { label: 'Acondicionador', value: conditioner },
      { label: 'Tratamiento', value: treatment },
      { label: stylingMethod ? `Método ${stylingMethod}` : 'Leave-in', value: leaveIn },
    ];
    if (gel) steps.push({ label: 'Gel definidor', value: gel });
    steps.push({ label: 'Aceite sellador', value: oil });
    if (needsProtein) {
      steps.push({ label: 'Frecuencia proteica', value: `Tratamiento proteico cada ${proteinFrequencyWeeks} semanas. Siempre seguir con mascarilla hidratante.` });
    } else if (lowElasticity) {
      steps.push({ label: 'Elasticidad', value: 'Incluye tratamiento proteico ligero cada 3-4 semanas para recuperar la elasticidad. Sigue siempre con hidratación.' });
    }
    return steps;
  };

  const getPersonalizedTips = (profile) => {
    const tips = [];
    const {
      oilyScalp, dryScalp, highPorosity, lowPorosity, isChemical, isHeatDamaged, isAlisado,
      needsProtein, isScalpOilyWithDryEnds, isCurlyOrWavy, damageLevel, stylingMethod,
      hasDandruff, hasSensitivity, hasHairLoss, lowElasticity, isTransicion, isCoily,
      heatFrequency, fineStrand, coarseStrand,
    } = profile;

    if (isTransicion) tips.push({
      title: 'Cuidado en transición capilar',
      description: 'Tu cabello tiene dos zonas con necesidades distintas: la raíz natural necesita hidratación y definición, mientras que las puntas tratadas necesitan reparación. Trabaja en secciones y evita estirar el punto de demarcación para reducir el quiebre.',
      videoQuery: 'transición capilar cabello cuidado',
    });
    if (isScalpOilyWithDryEnds) tips.push({
      title: 'Tratamiento por zonas',
      description: 'Tu raíz produce exceso de sebo pero las puntas están secas o dañadas. Aplica el shampoo solo en la raíz y el acondicionador/mascarilla solo en medios y puntas. Los aceites pesados en la raíz agravan la oleosidad.',
      videoQuery: 'tratamiento cabello raíz grasosa puntas secas',
    });
    if (isCoily) tips.push({
      title: 'Hidratación profunda para cabello coily',
      description: 'El cabello afrorizado es naturalmente más seco porque el sebo tarda en bajar por la espiral del cabello. Aplica el método LOC o LCO cada vez que mojes y usa mascarillas intensivas semanales. El pre-poo con aceite antes del lavado protege las puntas.',
      videoQuery: 'cabello afrorizado hidratación LOC LCO método',
    });
    if (isCurlyOrWavy && fineStrand) tips.push({
      title: 'Productos ligeros para rizo fino',
      description: 'Tu cabello fino y rizado necesita definición sin peso. Las mousses y espumas ligeras definen sin aplanar el rizo. Las cremas muy pesadas o el exceso de aceite quitan volumen. Prefiere geles fluidos sobre cremas densas.',
      videoQuery: 'cabello rizado fino productos ligeros definición',
    });
    if (hasDandruff) tips.push({
      title: 'Control de caspa',
      description: 'La caspa puede ser oleosa (escamas amarillentas) o seca (escamas blancas). Usa shampoo con zinc piritionato o ketoconazol 2 veces/semana. Evita agua muy caliente y alterna con shampoo nutritivo para no resecar el cuero cabelludo.',
      videoQuery: 'control caspa shampoo anticaspa',
    });
    if (hasHairLoss) tips.push({
      title: 'Estimular el folículo capilar',
      description: 'Incorpora un tónico estimulante con cafeína o biotina directamente en el cuero cabelludo. Masajea 3-5 minutos al aplicarlo para activar la circulación. Evita colas y peinados muy tensos que traccionan el folículo.',
      videoQuery: 'caída cabello estimular folículos masaje cuero cabelludo',
    });
    if (hasSensitivity) tips.push({
      title: 'Cuero cabelludo sensible',
      description: 'Evita productos con alcohol deshidratante, parfum y sulfatos agresivos. Enjuaga siempre con agua fría al final para cerrar los poros. Haz una prueba de parche antes de introducir nuevos productos.',
      videoQuery: 'cuero cabelludo sensible irritación productos suaves',
    });
    if (lowElasticity) tips.push({
      title: 'Recupera la elasticidad',
      description: 'La elasticidad baja indica déficit de proteína en la corteza. Incorpora una mascarilla proteica ligera (hidrolizada) cada 2-3 semanas y sigue siempre con una hidratante. Si el cabello se vuelve rígido o crujiente, pausa la proteína y enfócate en hidratación.',
      videoQuery: 'elasticidad cabello proteína tratamiento recuperar',
    });
    if (coarseStrand) tips.push({
      title: 'Cabello grueso — penetración profunda',
      description: 'La cutícula gruesa necesita calor suave para abrir y absorber productos. Aplica mascarillas bajo un gorro de ducha durante 20-30 min. Los aceites densos como coco o aguacate penetran mejor que los silicones.',
      videoQuery: 'cabello grueso mascarilla profunda penetración',
    });
    if (isChemical && dryScalp) tips.push({
      title: 'Reparación sin agravar la sequedad',
      description: 'El proceso químico combinado con cuero cabelludo seco requiere bond builders (como Olaplex) que reparan sin resecar. Lava máximo 2 veces por semana con shampoo ultra suave libre de sulfatos.',
      videoQuery: 'cabello procesado cuero cabelludo seco Olaplex reparación',
    });
    if (oilyScalp && !isScalpOilyWithDryEnds) tips.push({
      title: 'Limpieza selectiva en raíz',
      description: 'Aplica el shampoo exclusivamente en el cuero cabelludo, sin frotar el largo. Lavar las puntas con frecuencia las reseca y aumenta la producción de sebo. Termina con agua fría para cerrar los poros.',
      videoQuery: 'cuero cabelludo grasoso limpieza selectiva raíz',
    });
    if (highPorosity) tips.push({
      title: 'Sella la cutícula abierta',
      description: 'La porosidad alta indica cutículas levantadas que pierden humedad fácilmente. Termina siempre con agua fría, aplica aceite después del leave-in para sellar, y evita agua caliente que abre más la cutícula.',
      videoQuery: 'porosidad alta cabello sellar cutícula agua fría',
    });
    if (lowPorosity) tips.push({
      title: 'Activa la absorción con calor suave',
      description: 'La porosidad baja resiste la entrada de productos. Aplica tratamientos con el cabello húmedo y cálido (gorro de vapor o toalla tibia), dejando actuar más tiempo. El calor suave abre la cutícula temporalmente.',
      videoQuery: 'porosidad baja cabello calor vapor absorción',
    });
    if (needsProtein && !lowElasticity) tips.push({
      title: 'Balance proteína / hidratación',
      description: 'Si el cabello se siente rígido o crujiente, es exceso de proteína; si se estira sin volver y se rompe fácil, falta proteína. Siempre sigue un tratamiento proteico con una mascarilla hidratante.',
      videoQuery: 'balance proteína hidratación cabello tratamiento',
    });
    if (isCurlyOrWavy && stylingMethod) tips.push({
      title: `Método ${stylingMethod} para tus rizos`,
      description: stylingMethod === 'LOC'
        ? 'Alta porosidad → LOC: Leave-in (hidratación) → Oil (sella antes de que se evapore) → Cream (define). El aceite entre capas protege la humedad del leave-in.'
        : 'Porosidad media → LCO: Leave-in → Cream (define y penetra mejor) → Oil (sella al final). La crema funciona mejor sobre el leave-in antes del aceite en tu tipo de porosidad.',
      videoQuery: `método ${stylingMethod} cabello rizado rizos`,
    });
    if (heatFrequency === 'Frecuente' || (isHeatDamaged && !isAlisado)) tips.push({
      title: 'Protección térmica siempre',
      description: 'Aplica siempre un protector térmico antes de cualquier herramienta con calor. Usa temperatura máxima de 180°C y no repases la misma sección más de dos veces.',
      videoQuery: 'protector térmico cabello heat protectant secador',
    });
    if (damageLevel === 'Alto') tips.push({
      title: 'Reconstrucción progresiva',
      description: 'Con daño alto, los tratamientos reparadores semanales son esenciales durante al menos 4-6 semanas. Evita el calor directo y usa difusor a temperatura baja si necesitas secar.',
      videoQuery: 'cabello dañado reparación tratamiento intensivo',
    });
    if (damageLevel === 'Bajo' && !lowElasticity && !hasDandruff && !hasHairLoss) tips.push({
      title: 'Mantén la salud sin sobretratar',
      description: 'Tu cabello está en buen estado. Elige productos ligeros y evita acumular tratamientos innecesarios. Una rutina simple y consistente es más efectiva que muchos productos.',
      videoQuery: 'rutina cabello simple mantenimiento salud',
    });
    return tips.slice(0, 5);
  };

  const getFrequencyRecommendations = (profile) => {
    const {
      oilyScalp, dryScalp, highPorosity, lowPorosity, needsProtein,
      proteinFrequencyWeeks, damageLevel, isCoily, hasDandruff,
    } = profile;

    const washFreq = hasDandruff
      ? '2-3 veces/semana (shampoo anticaspa alterno con suave)'
      : oilyScalp
      ? '2-3 veces/semana en raíz. Puntas: shampoo 1 vez/semana.'
      : dryScalp || isCoily
      ? '1-2 veces por semana máximo'
      : '2 veces por semana';

    const treatmentFreq = damageLevel === 'Alto'
      ? 'Mascarilla reparadora 1 vez por semana'
      : damageLevel === 'Moderado-Alto'
      ? 'Mascarilla 1 vez/semana, profunda cada 2 semanas'
      : damageLevel === 'Moderado'
      ? 'Mascarilla hidratante cada 10-14 días'
      : 'Mascarilla hidratante 2 veces al mes';

    const hydrationFreq = highPorosity
      ? '2 veces por semana (retiene poca hidratación)'
      : lowPorosity
      ? '1 vez por semana (absorción lenta, más tiempo de acción)'
      : isCoily
      ? '2 veces por semana (necesita hidratación constante)'
      : '1-2 veces por semana según el cabello';

    const result = [
      { label: 'Lavado', value: washFreq },
      { label: 'Tratamiento / Mascarilla', value: treatmentFreq },
      { label: 'Hidratación profunda', value: hydrationFreq },
    ];
    if (needsProtein) {
      result.push({ label: 'Tratamiento proteico', value: `Cada ${proteinFrequencyWeeks} semanas. Siempre seguir con mascarilla hidratante.` });
    }
    return result;
  };

  const generateResult = (answersObject) => {
    setIsLoadingDiagnosis(true);
    spinAnim.setValue(0);

    setTimeout(() => {
      const profile = buildHairProfile(answersObject);
      
      // Crear una versión limpia del perfil solo con flags booleanos
      const profileFlags = {
        // Textura
        isLacio: profile.isLacio,
        isOndulado: profile.isOndulado,
        isRizado: profile.isRizado,
        isCoily: profile.isCoily,
        isTransicion: profile.isTransicion,
        isCurly: profile.isCurly,
        isWavy: profile.isWavy,
        isCurlyOrWavy: profile.isCurlyOrWavy,
        // Densidad
        lowDensity: profile.lowDensity,
        highDensity: profile.highDensity,
        fineDensity: profile.fineDensity,
        denseDensity: profile.denseDensity,
        // Porosidad
        highPorosity: profile.highPorosity,
        lowPorosity: profile.lowPorosity,
        // Cuero cabelludo
        oilyScalp: profile.oilyScalp,
        dryScalp: profile.dryScalp,
        // Otros
        isChemical: profile.isChemical,
        isColor: profile.isColor,
        isAlisado: profile.isAlisado,
        isVarios: profile.isVarios,
        isHeatDamaged: profile.isHeatDamaged,
        needsProtein: profile.needsProtein,
        needsClarifying: profile.needsClarifying,
        isScalpOilyWithDryEnds: profile.isScalpOilyWithDryEnds,
        lowElasticity: profile.lowElasticity,
        hasDandruff: profile.hasDandruff,
        hasSensitivity: profile.hasSensitivity,
        hasHairLoss: profile.hasHairLoss,
        fineStrand: profile.fineStrand,
        coarseStrand: profile.coarseStrand,
      };
      
      const trueFlags = Object.entries(profileFlags)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      console.log("✅ [generateResult] Profile flags (true values):", trueFlags);
      
      AsyncStorage.setItem('@mybeauty-calendar:hairProfile', JSON.stringify(profileFlags))
        .catch((err) => {
          console.error("❌ [generateResult] Error saving profile:", err);
        });

      
      const { damageLevel, stylingMethod } = profile;
      const recommendedProducts = getRecommendedProducts(profile);
      const routinePlanResult = getRoutinePlan(profile, recommendedProducts);
      const resultObject = {
        hairType: getHairType(answersObject),
        objective: getObjectiveLabel(answersObject.objective),
        texture: answersObject.texture,
        curlType: answersObject.curlType,
        porosity: getPorosity(answersObject.porosity),
        density: answersObject.density,
        strandThickness: answersObject.strandThickness,
        elasticity: answersObject.elasticity,
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
      };
      setRoutinePlan(routinePlanResult);
      setResult(resultObject);
      AsyncStorage.multiSet([
        ['@mybeauty-calendar:diagnosisResult', JSON.stringify(resultObject)],
        ['@mybeauty-calendar:diagnosisRoutinePlan', JSON.stringify(routinePlanResult)],
        ['@mybeauty-calendar:calendarNeedsRefresh', 'true'],
      ]).catch(() => {});
      setIsLoadingDiagnosis(false);
    }, 1800);
  };

  const handleReset = () => {
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    setImage(null);
    AsyncStorage.multiRemove([
      '@mybeauty-calendar:hairProfile',
      '@mybeauty-calendar:diagnosisResult',
      '@mybeauty-calendar:diagnosisRoutinePlan',
    ]).catch(() => {});
  };

  // ── RESULT SCREEN ────────────────────────────────────────────────────────────

  // Modal de carga (mostrar siempre que esté cargando)
  if (isLoadingDiagnosis) {
    return (
      <Modal
        visible={isLoadingDiagnosis}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loadingGradient}
            >
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                <Ionicons name="sparkles" size={48} color="#fff" />
              </Animated.View>
              <Text style={styles.loadingText}>Analizando tu cabello...</Text>
              <Text style={styles.loadingSubtext}>Generando recomendaciones personalizadas</Text>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    );
  }

  if (result) {
    const damageColor =
      result.damageLevel === 'Alto' ? '#E07A7A' :
      result.damageLevel === 'Moderado-Alto' ? '#E8956A' :
      result.damageLevel === 'Moderado' ? '#C4A870' : '#7AAE7A';

    const elasticityColor =
      result.elasticity === 'Baja' ? '#E07A7A' :
      result.elasticity === 'Normal' ? '#C4A870' : '#7AAE7A';

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
            <TouchableOpacity onPress={handleReset} style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tu Diagnóstico</Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.resultAvatarSection}>
            <View style={styles.resultIconCircle}>
              <Ionicons name="sparkles" size={18} color="#BF789C" />
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
            {result.strandThickness && (
              <StatChip icon="resize-outline" label="Grosor mechón" value={result.strandThickness} />
            )}
            <StatChip icon="leaf-outline" label="Cuero cabelludo" value={result.scalpCondition} />
            <StatChip icon="alert-circle-outline" label="Nivel de daño" value={result.damageLevel} valueColor={damageColor} />
            {result.elasticity && (
              <StatChip icon="fitness-outline" label="Elasticidad" value={result.elasticity} valueColor={elasticityColor} />
            )}
            {result.curlType && (
              <StatChip icon="git-branch-outline" label="Subtipo" value={result.curlType} />
            )}
            {result.stylingMethod && (
              <StatChip icon="color-wand-outline" label="Método" value={`Método ${result.stylingMethod}`} />
            )}
          </View>

          {/* BOTÓN CALENDARIO */}
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 20, marginBottom: 4 }]}
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
              <Text style={styles.primaryButtonText}>Ver rutina en el calendario</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* PRODUCTOS SUGERIDOS */}
          <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
            <Ionicons name="bag-handle-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Productos sugeridos</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Explorar')}
            activeOpacity={0.85}
            style={styles.productsButton}
          >
            <Ionicons name="sparkles-outline" size={16} color="#8A6B00" style={{ marginRight: 8 }} />
            <Text style={styles.productsButtonText}>Ver productos recomendados para ti</Text>
            <Ionicons name="chevron-forward" size={16} color="#8A6B00" />
          </TouchableOpacity>

          {/* TIPS */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionTitle}>Tips personalizados</Text>
          </View>
          {result.recommendations.tips.map((tip, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tipCard}
              onPress={async () => {
                setVideoModal(prev => ({ ...prev, isLoadingVideos: true, label: tip.title, value: tip.description, videos: [] }));
                const videos = await searchYouTubeVideos(tip.videoQuery, 6);
                setVideoModal(prev => ({ ...prev, visible: true, isLoadingVideos: false, videos }));
              }}
              activeOpacity={0.85}
            >
              <View style={styles.tipCardTop}>
                <View style={styles.tipDot} />
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Ionicons name="play-circle-outline" size={18} color="#D6A4A4" />
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

          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Nuevo diagnóstico</Text>
          </TouchableOpacity>

          <YouTubeCarousel
            query={`rutina cabello ${result.curlType ?? result.texture?.toLowerCase() ?? 'capilar'} ${result.objective ?? ''} tutorial`}
            title="Videos recomendados para ti"
          />
        </ScrollView>

        <Modal
          visible={videoModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setVideoModal({ visible: false, label: '', value: '', videos: [], isLoadingVideos: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleDot} />
                <Text style={styles.modalTitle} numberOfLines={2}>{videoModal.label}</Text>
                <TouchableOpacity
                  onPress={() => setVideoModal({ visible: false, label: '', value: '', videos: [], isLoadingVideos: false })}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={18} color="#888" />
                </TouchableOpacity>
              </View>

              {videoModal.isLoadingVideos ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Buscando video...</Text>
                </View>
              ) : videoModal.videos && videoModal.videos.length > 0 ? (
                <View style={styles.ytPlayerWrap}>
                  <YoutubeIframe
                    videoId={videoModal.videos[0].id}
                    width={MODAL_CARD_WIDTH}
                    height={MODAL_VIDEO_HEIGHT}
                    play
                  />
                </View>
              ) : (() => {
                const ytKey = getStepVideoKey(videoModal.label, result?.texture);
                const ytVideo = ytKey ? routineVideos[ytKey] : null;
                if (ytVideo?.youtubeId) {
                  const ytId = ytVideo.youtubeId;
                  return (
                    <View style={styles.ytPlayerWrap}>
                      <YoutubeIframe
                        videoId={ytId}
                        width={MODAL_CARD_WIDTH}
                        height={MODAL_VIDEO_HEIGHT}
                        play
                      />
                    </View>
                  );
                }
                const videoData = ytVideo || routineVideos[ytKey];
                if (videoData?.uri) {
                  return (
                    <View style={styles.videoContainer}>
                      <Video
                        ref={videoRef}
                        source={{ uri: videoData.uri }}
                        style={styles.modalVideo}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        useNativeControls
                      />
                      <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => videoRef.current?.presentFullscreenPlayer()}
                      >
                        <Ionicons name="expand-outline" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam-off-outline" size={48} color="#D6A4A4" />
                    <Text style={styles.videoPlaceholderText}>No hay video disponible</Text>
                  </View>
                );
              })()}

              <Text style={styles.modalDesc}>{videoModal.value}</Text>
            </View>
          </View>
        </Modal>
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

      <PanGestureHandler onHandlerStateChange={handleSwipeGesture} activeOffsetX={[-10, 10]} activeOffsetY={[-1000, 1000]}>
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
            // Opciones dinámicas para subtipo de rizo
            const itemOptions = item.id === 'curlType'
              ? (CURL_TYPE_OPTIONS[answers.texture] || [])
              : item.options;

            const currentAnswerForItem = answers[item.id];

            return (
              <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.slideContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.stepLabel}>
                    {item.id === 'photo'
                      ? 'Paso final · Opcional'
                      : item.multiSelect
                      ? 'Selección múltiple'
                      : `Pregunta ${index + 1} de ${questions.length}`}
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
                      {itemOptions.map((option) => {
                        const isActive = item.multiSelect
                          ? Array.isArray(currentAnswerForItem) && currentAnswerForItem.includes(option.value)
                          : currentAnswerForItem === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[styles.optionCard, isActive && styles.optionCardActive]}
                            activeOpacity={0.85}
                            onPress={() => handleSelectOption(item.id, option.value)}
                          >
                            {isActive && (
                              <LinearGradient
                                colors={['#D6A4A4', '#BF789C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                            )}
                            <View style={styles.optionCardInner}>
                              <View style={[styles.optionRadio, isActive && styles.optionRadioActive]}>
                                {isActive && (
                                  item.multiSelect
                                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                                    : <View style={styles.optionRadioDot} />
                                )}
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
      </PanGestureHandler>

      <View style={[styles.nextContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.85}
            disabled={currentQuestion === 0}
            style={styles.backButtonWrapper}
          >
            <LinearGradient
              colors={currentQuestion === 0
                ? ['#E2C8D4', '#CCB0C0']
                : ['#F5E0EC', '#E8D0DC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={currentQuestion === 0 ? '#BFBFBF' : '#D6A4A4'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.backText, currentQuestion === 0 && { color: '#BFBFBF' }]}>Atrás</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={!hasCurrentAnswer}
            style={styles.nextButtonWrapper}
          >
            <LinearGradient
              colors={!hasCurrentAnswer
                ? ['#E2C8D4', '#CCB0C0']
                : ['#D6A4A4', '#BF789C']}
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
    paddingBottom: 50,
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
    backgroundColor: 'transparent',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButtonWrapper: {
    flex: 0.35,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
  },
  backText: {
    color: '#D6A4A4',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextButtonWrapper: {
    flex: 1,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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

  // products button
  productsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5C2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#F0D97A',
    marginBottom: 24,
  },
  productsButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#8A6B00',
  },

  // product categories and cards
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

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  // modal video flotante
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,10,20,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1C1220',
    borderRadius: 24,
    overflow: 'hidden',
    width: MODAL_CARD_WIDTH,
    shadowColor: '#D6A4A4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  modalTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
    flexShrink: 0,
  },
  modalTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#F5E0EC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(214,164,164,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytPlayerWrap: {
    backgroundColor: '#000',
  },
  ytThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 4,
  },
  ytThumb: {
    width: '100%',
    height: '100%',
  },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    gap: 8,
  },
  ytPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytPlayLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  videoContainer: {
    position: 'relative',
    flex: 1,
  },
  modalVideo: {
    width: MODAL_CARD_WIDTH,
    height: MODAL_VIDEO_HEIGHT,
    backgroundColor: '#1A1A1A',
  },
  expandBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: 'rgba(245,224,236,0.7)',
    lineHeight: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
  },

  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  videosContainer: {
    height: 240,
    marginVertical: 12,
  },
  videosScrollView: {
    flex: 1,
  },
  videoThumbnail: {
    marginHorizontal: 8,
    width: 140,
    alignItems: 'center',
    paddingVertical: 4,
  },
  videoThumbnailImage: {
    width: 140,
    height: 84,
    borderRadius: 8,
    marginBottom: 8,
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoTitle: {
    fontSize: 11,
    color: '#2D2D2D',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    width: 140,
  },
  videoPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 164, 164, 0.1)',
    borderRadius: 12,
    marginVertical: 12,
  },
  videoPlaceholderText: {
    fontSize: 14,
    color: '#D6A4A4',
    marginTop: 12,
    fontWeight: '600',
  },

  // loading modal
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,45,45,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    width: 200,
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 25,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  spinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
