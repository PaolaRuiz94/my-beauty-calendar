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
import { VideoView, useVideoPlayer } from 'expo-video';
import YoutubeIframe from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRoutineVideos } from '../firebase/videos';
import { fetchStoresWithCatalog, fetchStoreProductDB } from '../firebase/stores';
import { searchYouTubeVideos } from '../services/youtube';
import YouTubeCarousel from './YouTubeCarousel';
import StatChip from './diagnosis/StatChip';
import StoreSelectionStep from './diagnosis/StoreSelectionStep';
import styles from './DiagnosisScreen.styles';
import { questions, CURL_TYPE_OPTIONS, getStepVideoKey } from '../data/diagnosisQuestions';
import {
  getScalpCondition,
  getPorosity,
  buildHairProfile,
  getHairType,
  getObjectiveLabel,
  getRoutinePlan,
  getRecommendedProducts,
  getCategorizedProducts,
  getRoutineSteps,
  getPersonalizedTips,
  getFrequencyRecommendations,
} from '../utils/hairDiagnosisEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_CARD_WIDTH = SCREEN_WIDTH - 48;
const MODAL_VIDEO_HEIGHT = Math.round(MODAL_CARD_WIDTH * 9 / 16);

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiagnosisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [routinePlan, setRoutinePlan] = useState([]);
  const [routinePlanByTier, setRoutinePlanByTier] = useState(null);
  const [defaultBudgetTier, setDefaultBudgetTier] = useState('mid');
  const [image, setImage] = useState(null);
  const [videoModal, setVideoModal] = useState({ visible: false, label: '', value: '', videos: [], isLoadingVideos: false });
  const [routineVideos, setRoutineVideos] = useState({});

  // ── Selector de país / tienda (paso previo al quiz) ─────────────────────────
  const [country, setCountry] = useState(undefined); // undefined = cargando desde AsyncStorage
  const [selectedStoreId, setSelectedStoreId] = useState(undefined); // undefined = sin resolver; null = genérico
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const flatListRef = useRef(null);
  const videoRef = useRef(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const modalYtKey = getStepVideoKey(videoModal.label, result?.texture);
  const modalVideoData = modalYtKey ? routineVideos[modalYtKey] : null;
  const modalVideoUri = !modalVideoData?.youtubeId && modalVideoData?.uri ? modalVideoData.uri : null;
  const modalPlayer = useVideoPlayer(modalVideoUri, (p) => {
    if (modalVideoUri) p.play();
  });

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
    AsyncStorage.getItem('@mybeauty-calendar:country')
      .then((saved) => setCountry(saved || null))
      .catch(() => setCountry(null));
  }, []);

  // Si no hay país guardado, si el país no es Colombia, o si Colombia no tiene
  // tiendas con catálogo todavía, no hay nada que preguntar — saltamos directo
  // al diagnóstico genérico sin que la usuaria vea ningún paso extra. La espera
  // del fetch y la decisión de saltar viven en el MISMO efecto a propósito: si
  // se separan (uno que hace fetch, otro que decide) hay una carrera donde el
  // que decide lee loadingStores/stores desde una closure vieja, antes de que
  // el fetch termine, y siempre concluye "no hay tiendas" de entrada.
  useEffect(() => {
    if (country === undefined) return;
    if (country !== 'Colombia') { setSelectedStoreId(null); return; }

    let cancelled = false;
    setLoadingStores(true);
    fetchStoresWithCatalog()
      .then((result) => {
        if (cancelled) return;
        // fetchStoresWithCatalog trae tiendas de cualquier país (no filtra por
        // ubicación); acá nos quedamos solo con las del país elegido. Las que
        // no tienen campo `pais` son datos de antes de que existiera (o de
        // prueba) — se tratan como Colombia en vez de excluirlas.
        const enPais = result.filter((s) => !s.pais || s.pais === country);
        setStores(enPais);
        if (enPais.length === 0) setSelectedStoreId(null);
      })
      .catch(() => {
        if (cancelled) return;
        setStores([]);
        setSelectedStoreId(null);
      })
      .finally(() => { if (!cancelled) setLoadingStores(false); });

    return () => { cancelled = true; };
  }, [country]);

  // Cubre "Nuevo diagnóstico": si ya sabíamos que Colombia no tiene tiendas y
  // se vuelve a pedir elegir tienda, saltamos otra vez sin re-hacer el fetch.
  // Deps a propósito solo [selectedStoreId] (no country/stores/loadingStores):
  // si se agregan, este efecto se dispara en el mismo commit que el de arriba
  // cuando country recién cambia, con closures viejas de stores/loadingStores
  // (el mismo bug de carrera que el comentario de arriba explica). Al depender
  // solo de selectedStoreId, este efecto no corre en ese commit — solo cuando
  // selectedStoreId cambia de verdad (montaje o handleReset), momento en el
  // que stores/loadingStores ya están asentados.
  useEffect(() => {
    if (selectedStoreId !== undefined) return;
    if (country !== 'Colombia' || loadingStores) return;
    if (stores.length === 0) setSelectedStoreId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  useEffect(() => {
    if (selectedStoreId === undefined) return;
    AsyncStorage.setItem('@mybeauty-calendar:selectedStoreId', JSON.stringify(selectedStoreId)).catch(() => {});
  }, [selectedStoreId]);

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

  const handleSelectCountry = (value) => {
    setCountry(value);
    AsyncStorage.setItem('@mybeauty-calendar:country', value).catch(() => {});
  };

  const handleSelectStore = (storeId) => {
    setSelectedStoreId(storeId);
  };

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


  const generateResult = async (answersObject) => {
    setIsLoadingDiagnosis(true);
    spinAnim.setValue(0);

    const [storeProductDB] = await Promise.all([
      selectedStoreId ? fetchStoreProductDB(selectedStoreId).catch(() => null) : Promise.resolve(null),
      new Promise((resolve) => setTimeout(resolve, 1800)),
    ]);

    const profile = buildHairProfile(answersObject);
      
      // Crear una versión limpia del perfil solo con flags booleanos
      const profileFlags = {
        // Campos usados por el scoring de reemplazo de productos (no son flags booleanos)
        objective: profile.objective,
        length: profile.length,
        scalp: profile.scalp,
        texture: profile.texture,
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
      AsyncStorage.setItem('@mybeauty-calendar:hairProfile', JSON.stringify(profileFlags))
        .catch((err) => {
          console.error("❌ [generateResult] Error saving profile:", err);
        });

      
      const { damageLevel, stylingMethod } = profile;
      const { products: recommendedProducts, treatments, byTier, defaultTier } = getRecommendedProducts(profile, storeProductDB);
      const routinePlanResult = getRoutinePlan(profile, { products: recommendedProducts, treatments });
      const routinePlanByTier = {
        low:  getRoutinePlan(profile, byTier.low),
        mid:  getRoutinePlan(profile, byTier.mid),
        high: getRoutinePlan(profile, byTier.high),
      };
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
      setRoutinePlanByTier(routinePlanByTier);
      setDefaultBudgetTier(defaultTier);
      setResult(resultObject);
      AsyncStorage.multiSet([
        ['@mybeauty-calendar:diagnosisResult', JSON.stringify(resultObject)],
        ['@mybeauty-calendar:diagnosisRoutinePlan', JSON.stringify(routinePlanResult)],
        ['@mybeauty-calendar:diagnosisRoutinePlanByTier', JSON.stringify(routinePlanByTier)],
        ['@mybeauty-calendar:budgetTier', defaultTier],
        ['@mybeauty-calendar:calendarNeedsRefresh', 'true'],
      ]).catch(() => {});
      setIsLoadingDiagnosis(false);
  };

  const handleReset = () => {
    setResult(null);
    setAnswers({});
    setCurrentQuestion(0);
    setImage(null);
    setSelectedStoreId(undefined);
    AsyncStorage.multiRemove([
      '@mybeauty-calendar:hairProfile',
      '@mybeauty-calendar:diagnosisResult',
      '@mybeauty-calendar:diagnosisRoutinePlan',
      '@mybeauty-calendar:selectedStoreId',
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
            <TouchableOpacity
              onPress={handleReset}
              style={styles.headerBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar diagnóstico"
            >
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
            onPress={() => navigation.navigate('Calendario', { screen: 'CalendarMain', params: { routinePlan, routinePlanByTier, defaultTier: defaultBudgetTier, objective: result.objective, storeId: selectedStoreId ?? null } })}
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
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar video"
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
                if (modalVideoData?.youtubeId) {
                  return (
                    <View style={styles.ytPlayerWrap}>
                      <YoutubeIframe
                        videoId={modalVideoData.youtubeId}
                        width={MODAL_CARD_WIDTH}
                        height={MODAL_VIDEO_HEIGHT}
                        play
                      />
                    </View>
                  );
                }
                if (modalVideoUri) {
                  return (
                    <View style={styles.videoContainer}>
                      <VideoView
                        ref={videoRef}
                        player={modalPlayer}
                        style={styles.modalVideo}
                        contentFit="contain"
                        nativeControls
                      />
                      <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => videoRef.current?.enterFullscreen()}
                        accessibilityRole="button"
                        accessibilityLabel="Pantalla completa"
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

  // ── SELECTOR DE PAÍS / TIENDA (antes del quiz) ──────────────────────────────

  if (selectedStoreId === undefined) {
    if (country === undefined) return null; // cargando país guardado
    return (
      <StoreSelectionStep
        country={country}
        stores={stores}
        loadingStores={loadingStores}
        onSelectCountry={handleSelectCountry}
        onSelectStore={handleSelectStore}
      />
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
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickImage}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Subir foto de tu cabello"
                    >
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

