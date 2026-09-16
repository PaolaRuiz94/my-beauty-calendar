import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  Platform,
  ActionSheetIOS,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BeautyCalendarHeader from './BeautyCalendarHeader';
import { fetchProductsByProfile } from '../firebase/products';
import { fetchStoreProductDB } from '../firebase/stores';
import { PRICE_TIER_LABELS, PRODUCTS } from '../data/products';
import { syncRoutineNotifications } from '../services/notificationService';
import { getMatchingProducts, CATEGORY_KEY } from '../utils/productScoring';
import { getWeatherContext, getWeatherBoostTags, getWeatherHairTip } from '../services/weatherService';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../auth/AuthContext';
import { saveDiaryEntry } from '../firebase/diary';
import { addProgressPhoto } from '../firebase/progressPhotos';
import * as ImagePicker from 'expo-image-picker';
import styles from './CalendarScreen.styles';
import { TIPS, MOTIVATIONS, DIARY_HAIR_FEEL, DIARY_HYDRATION, DIARY_SCALP } from '../data/calendarContent';
import {
  buildDayFromCycleIndex,
  expandPlanTo30Days,
  fmtDate,
  buildMarkedDates,
  buildCompletedDates,
  calcStreak,
} from '../utils/routineCalendar';
import ChipGroup from './calendar/ChipGroup';
import YesNo from './calendar/YesNo';
import ProductThumb from './calendar/ProductThumb';
import RoutineCard from './calendar/RoutineCard';


// ─── screen ──────────────────────────────────────────────────────────────────

export default function CalendarScreen({ route, navigation }) {
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const [selectedDate,     setSelectedDate]     = useState(new Date().toISOString().split('T')[0]);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [dayByDate,    setDayByDate]    = useState({});
  const [nightByDate,  setNightByDate]  = useState({});
  const [dayDone,      setDayDone]      = useState({});
  const [nightDone,    setNightDone]    = useState({});
  const [weather,      setWeather]      = useState(null);
  const [profileProducts, setProfileProducts] = useState([]);
  const [productModal, setProductModal] = useState({ visible: false, dateStr: '', stepIndex: 0, category: '', isNight: false });
  const [points, setPoints] = useState(0);
  const [notifModal, setNotifModal] = useState(false);
  const [scheduledNotifs, setScheduledNotifs] = useState([]);
  const [streakModal, setStreakModal] = useState(false);
  const [tipLiked, setTipLiked] = useState(false);
  const [budgetTier, setBudgetTier] = useState('mid');
  const [routinePlanByTier, setRoutinePlanByTier] = useState(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [hairProfile, setHairProfile] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [storeProductDB, setStoreProductDB] = useState(null);
  const [skippedDates, setSkippedDates] = useState({});
  const [cycleIndexByDate, setCycleIndexByDate] = useState({});
  const [defaultCycleIndexByDate, setDefaultCycleIndexByDate] = useState({});
  const [routineMenu, setRoutineMenu] = useState({ visible: false, isNight: false });
  const [washPickerVisible, setWashPickerVisible] = useState(false);
  const [stepRemoveModal, setStepRemoveModal] = useState({ visible: false, isNight: false });
  const isLoaded = useRef(false);

  // ── Agregar paso ────────────────────────────────────────────────────────────
  const [addPickerModal, setAddPickerModal] = useState({ visible: false, isNight: false });
  const [addStepModal, setAddStepModal] = useState({ visible: false, isNight: false });
  const [stepName, setStepName] = useState('');
  const [stepDesc, setStepDesc] = useState('');

  // ── Diario ─────────────────────────────────────────────────────────────────
  const [diaryModal,    setDiaryModal]    = useState(false);
  const diaryTranslateY = useRef(new Animated.Value(0)).current;
  const diaryPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) diaryTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Animated.timing(diaryTranslateY, { toValue: 600, duration: 220, useNativeDriver: true }).start(() => {
            setDiaryModal(false);
            diaryTranslateY.setValue(0);
          });
        } else {
          Animated.spring(diaryTranslateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;
  const [diaryHairFeel, setDiaryHairFeel] = useState([]);
  const [diaryHydration,setDiaryHydration]= useState('');
  const [diaryScalp,    setDiaryScalp]    = useState('');
  const [diaryHeat,     setDiaryHeat]     = useState(null);
  const [diaryWashed,   setDiaryWashed]   = useState(null);
  const [diaryNote,     setDiaryNote]     = useState('');
  const [diarySaving,   setDiarySaving]   = useState(false);
  const [diaryPhotos,   setDiaryPhotos]   = useState([]);
  const [diaryPhotoUploading, setDiaryPhotoUploading] = useState(false);

  const openNotifModal = async () => {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifs(all);
    setNotifModal(true);
  };

  // Reprograma las notificaciones cada vez que cambia la rutina real, el progreso
  // del día o los días saltados, para que el contenido nunca quede desactualizado.
  useEffect(() => {
    if (!isLoaded.current) return;
    const plan = routinePlanByTier?.[budgetTier] || [];
    const cycleTitleByDate = {};
    Object.entries(cycleIndexByDate).forEach(([date, idx]) => {
      cycleTitleByDate[date] = plan[idx]?.title;
    });
    syncRoutineNotifications({ dayByDate, nightByDate, skippedDates, dayDone, nightDone, cycleTitleByDate }).catch(() => {});
  }, [dayByDate, nightByDate, skippedDates, dayDone, nightDone, cycleIndexByDate, budgetTier, routinePlanByTier]);

  // ── Carga desde AsyncStorage al montar ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [savedDay, savedNight, dd, nd] = await Promise.all([
          AsyncStorage.getItem('@mybeauty-calendar:dayByDate'),
          AsyncStorage.getItem('@mybeauty-calendar:nightByDate'),
          AsyncStorage.getItem('@mybeauty-calendar:dayDone'),
          AsyncStorage.getItem('@mybeauty-calendar:nightDone'),
        ]);
        const pts = await AsyncStorage.getItem('@mybeauty-calendar:points');
        if (savedDay)   setDayByDate(JSON.parse(savedDay));
        if (savedNight) setNightByDate(JSON.parse(savedNight));
        if (dd)  setDayDone(JSON.parse(dd));
        if (nd)  setNightDone(JSON.parse(nd));
        if (pts) setPoints(JSON.parse(pts));

        const [planByTierRaw, tierRaw, profileForScoringRaw] = await Promise.all([
          AsyncStorage.getItem('@mybeauty-calendar:diagnosisRoutinePlanByTier'),
          AsyncStorage.getItem('@mybeauty-calendar:budgetTier'),
          AsyncStorage.getItem('@mybeauty-calendar:hairProfile'),
        ]);
        if (planByTierRaw) {
          try { setRoutinePlanByTier(JSON.parse(planByTierRaw)); } catch {}
        }
        if (tierRaw) setBudgetTier(tierRaw);
        if (profileForScoringRaw) {
          try { setHairProfile(JSON.parse(profileForScoringRaw)); } catch {}
        }

        const storeIdRaw = await AsyncStorage.getItem('@mybeauty-calendar:selectedStoreId');
        if (storeIdRaw) {
          try { setStoreId(JSON.parse(storeIdRaw)); } catch {}
        }

        const [skippedRaw, cycleIdxRaw, defaultCycleIdxRaw] = await Promise.all([
          AsyncStorage.getItem('@mybeauty-calendar:skippedDates'),
          AsyncStorage.getItem('@mybeauty-calendar:cycleIndexByDate'),
          AsyncStorage.getItem('@mybeauty-calendar:defaultCycleIndexByDate'),
        ]);
        if (skippedRaw) { try { setSkippedDates(JSON.parse(skippedRaw)); } catch {} }
        if (cycleIdxRaw) { try { setCycleIndexByDate(JSON.parse(cycleIdxRaw)); } catch {} }
        if (defaultCycleIdxRaw) { try { setDefaultCycleIndexByDate(JSON.parse(defaultCycleIdxRaw)); } catch {} }

        // Si el calendario está vacío, auto-poblar desde el diagnóstico guardado
        if (!savedDay) {
          const [planRaw, profileRaw] = await Promise.all([
            AsyncStorage.getItem('@mybeauty-calendar:diagnosisRoutinePlan'),
            AsyncStorage.getItem('@mybeauty-calendar:hairProfile'),
          ]);
          if (planRaw) {
            const plan = JSON.parse(planRaw);
            if (Array.isArray(plan) && plan.length > 0) {
              let products = [];
              if (profileRaw) {
                try {
                  const profile = JSON.parse(profileRaw);
                  const flags = Object.entries(profile).filter(([, v]) => v === true).map(([k]) => k);
                  products = await fetchProductsByProfile(flags);
                } catch {}
              }
              const { newDay, newNight, newCycleIndex } = expandPlanTo30Days(plan, products);
              setProfileProducts(products);
              setDayByDate(newDay);
              setNightByDate(newNight);
              setCycleIndexByDate(newCycleIndex);
              setDefaultCycleIndexByDate(newCycleIndex);
              setSkippedDates({});
              const first = Object.keys(newDay)[0];
              if (first) setSelectedDate(first);
            }
          }
        }
      } catch {}
      isLoaded.current = true;
    };
    load();
  }, []);

  // ── Carga el clima al montar ────────────────────────────────────────────────
  useEffect(() => {
    getWeatherContext()
      .then(ctx => { if (ctx) setWeather(ctx); })
      .catch(() => {});
  }, []);

  // ── Catálogo de la tienda elegida en el diagnóstico (para el selector de
  // "cambiar producto"; genérico si storeId es null) ─────────────────────────
  useEffect(() => {
    if (!storeId) { setStoreProductDB(null); return; }
    fetchStoreProductDB(storeId)
      .then(setStoreProductDB)
      .catch(() => setStoreProductDB(null));
  }, [storeId]);

  // ── Guarda en AsyncStorage cada vez que cambia el estado ────────────────────
  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:dayByDate', JSON.stringify(dayByDate)).catch(() => {});
  }, [dayByDate]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:nightByDate', JSON.stringify(nightByDate)).catch(() => {});
  }, [nightByDate]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:dayDone', JSON.stringify(dayDone)).catch(() => {});
  }, [dayDone]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:nightDone', JSON.stringify(nightDone)).catch(() => {});
  }, [nightDone]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:skippedDates', JSON.stringify(skippedDates)).catch(() => {});
  }, [skippedDates]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:cycleIndexByDate', JSON.stringify(cycleIndexByDate)).catch(() => {});
  }, [cycleIndexByDate]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:defaultCycleIndexByDate', JSON.stringify(defaultCycleIndexByDate)).catch(() => {});
  }, [defaultCycleIndexByDate]);

  useEffect(() => {
    if (!isLoaded.current) return;
    AsyncStorage.setItem('@mybeauty-calendar:points', JSON.stringify(points)).catch(() => {});
  }, [points]);

  const handleDatePress = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const switchBudgetTier = async (tier) => {
    if (tier === budgetTier) { setBudgetModalVisible(false); return; }
    const plan = routinePlanByTier?.[tier];
    if (!Array.isArray(plan) || plan.length === 0) { setBudgetModalVisible(false); return; }

    let products = profileProducts;
    try {
      const raw = await AsyncStorage.getItem('@mybeauty-calendar:hairProfile');
      if (raw) {
        const profile = JSON.parse(raw);
        const flags = Object.entries(profile).filter(([, v]) => v === true).map(([k]) => k);
        products = await fetchProductsByProfile(flags);
      }
    } catch {}

    const { newDay, newNight, newCycleIndex } = expandPlanTo30Days(plan, products);
    setProfileProducts(products);
    setDayByDate(newDay);
    setNightByDate(newNight);
    setCycleIndexByDate(newCycleIndex);
    setDefaultCycleIndexByDate(newCycleIndex);
    setSkippedDates({});
    setBudgetTier(tier);
    setBudgetModalVisible(false);
    AsyncStorage.setItem('@mybeauty-calendar:budgetTier', tier).catch(() => {});
  };

  // ── Menú "..." de la rutina: saltar día, eliminar paso, cambiar lavado, restablecer ──
  const openRoutineMenu = (isNight) => setRoutineMenu({ visible: true, isNight });

  const toggleSkipToday = () => {
    setRoutineMenu(m => ({ ...m, visible: false }));
    setSkippedDates(prev => {
      const next = { ...prev };
      if (next[selectedDate]) delete next[selectedDate];
      else next[selectedDate] = true;
      return next;
    });
  };

  const applyCycleIndexToDate = (cycleIdx) => {
    const plan = routinePlanByTier?.[budgetTier];
    if (!plan) return;
    const { day, night } = buildDayFromCycleIndex(plan, cycleIdx, profileProducts);
    setDayByDate(prev => ({ ...prev, [selectedDate]: day }));
    setNightByDate(prev => ({ ...prev, [selectedDate]: night }));
    setCycleIndexByDate(prev => ({ ...prev, [selectedDate]: cycleIdx }));
    setSkippedDates(prev => {
      if (!prev[selectedDate]) return prev;
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
  };

  const handleChangeWash = (cycleIdx) => {
    setWashPickerVisible(false);
    applyCycleIndexToDate(cycleIdx);
  };

  const handleResetRoutine = () => {
    setRoutineMenu(m => ({ ...m, visible: false }));
    const defaultIdx = defaultCycleIndexByDate[selectedDate];
    if (defaultIdx == null) return;
    applyCycleIndexToDate(defaultIdx);
  };

  const removeRoutineStep = (isNight, stepIndex) => {
    const setter = isNight ? setNightByDate : setDayByDate;
    setter(prev => {
      const steps = [...(prev[selectedDate] || [])];
      steps.splice(stepIndex, 1);
      return { ...prev, [selectedDate]: steps };
    });
  };

  const dayRoutines   = dayByDate[selectedDate]   || [];
  const nightRoutines = nightByDate[selectedDate]  || [];
  const dayCompleted  = dayDone[selectedDate]      || [];
  const nightCompleted= nightDone[selectedDate]    || [];

  // Alternativas de "cambiar producto": catálogo de la tienda si tiene algo en
  // esta categoría, si no cae a Amazon — misma regla que usa el diagnóstico.
  const productModalCategoryKey = CATEGORY_KEY[productModal.category] || productModal.category;
  const productModalStoreItems = storeProductDB?.[productModalCategoryKey] || [];
  const productModalSource = productModalStoreItems.length > 0 ? productModalStoreItems : PRODUCTS;

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const tipText = TIPS[dateObj.getDate() % TIPS.length];
  const motText = MOTIVATIONS[dateObj.getDay() % MOTIVATIONS.length];

  // populate 30-day plan from route params
  useEffect(() => {
    if (!route?.params?.routinePlan) return;
    const plan = route.params.routinePlan;
    if (!Array.isArray(plan)) return;

    const init = async () => {
      let products = [];
      try {
        const raw = await AsyncStorage.getItem('@mybeauty-calendar:hairProfile');
        if (raw) {
          const profile = JSON.parse(raw);
          const flags = Object.entries(profile)
            .filter(([, v]) => v === true)
            .map(([k]) => k);
          products = await fetchProductsByProfile(flags);
        }
      } catch {}

      let weatherCtx = null;
      try {
        weatherCtx = await getWeatherContext();
        if (weatherCtx) setWeather(weatherCtx);
      } catch {}

      if (weatherCtx?.flags?.length) {
        const boostTags = getWeatherBoostTags(weatherCtx.flags);
        products = [...products].sort((a, b) => {
          const boost = (p) => (p.tags || []).filter(t =>
            boostTags.some(bt => t.toLowerCase().includes(bt))
          ).length;
          return boost(b) - boost(a);
        });
      }

      const { newDay, newNight, newCycleIndex } = expandPlanTo30Days(plan, products);

      setProfileProducts(products);
      setDayByDate(newDay);
      setNightByDate(newNight);
      setCycleIndexByDate(newCycleIndex);
      setDefaultCycleIndexByDate(newCycleIndex);
      setSkippedDates({});
      const first = Object.keys(newDay)[0];
      if (first) setSelectedDate(first);

      if (route.params.routinePlanByTier) {
        setRoutinePlanByTier(route.params.routinePlanByTier);
        AsyncStorage.setItem('@mybeauty-calendar:diagnosisRoutinePlanByTier', JSON.stringify(route.params.routinePlanByTier)).catch(() => {});
      }
      if (route.params.defaultTier) {
        setBudgetTier(route.params.defaultTier);
        AsyncStorage.setItem('@mybeauty-calendar:budgetTier', route.params.defaultTier).catch(() => {});
      }
      if ('storeId' in route.params) {
        setStoreId(route.params.storeId);
        AsyncStorage.setItem('@mybeauty-calendar:selectedStoreId', JSON.stringify(route.params.storeId)).catch(() => {});
      }
    };

    init();
  }, [route]);

  // Repoblar calendario cuando el diagnóstico se completa (flag en AsyncStorage)
  useFocusEffect(useCallback(() => {
    const checkRefresh = async () => {
      const flag = await AsyncStorage.getItem('@mybeauty-calendar:calendarNeedsRefresh');
      if (flag !== 'true') return;

      await AsyncStorage.removeItem('@mybeauty-calendar:calendarNeedsRefresh');

      const [planRaw, profileRaw, planByTierRaw, tierRaw] = await Promise.all([
        AsyncStorage.getItem('@mybeauty-calendar:diagnosisRoutinePlan'),
        AsyncStorage.getItem('@mybeauty-calendar:hairProfile'),
        AsyncStorage.getItem('@mybeauty-calendar:diagnosisRoutinePlanByTier'),
        AsyncStorage.getItem('@mybeauty-calendar:budgetTier'),
      ]);
      if (!planRaw) return;
      const plan = JSON.parse(planRaw);
      if (!Array.isArray(plan) || plan.length === 0) return;

      let products = [];
      try {
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          setHairProfile(profile);
          const flags = Object.entries(profile).filter(([, v]) => v === true).map(([k]) => k);
          products = await fetchProductsByProfile(flags);
        }
      } catch {}

      const { newDay, newNight, newCycleIndex } = expandPlanTo30Days(plan, products);

      setProfileProducts(products);
      setDayByDate(newDay);
      setNightByDate(newNight);
      setCycleIndexByDate(newCycleIndex);
      setDefaultCycleIndexByDate(newCycleIndex);
      setSkippedDates({});
      setDayDone({});
      setNightDone({});
      if (planByTierRaw) {
        try { setRoutinePlanByTier(JSON.parse(planByTierRaw)); } catch {}
      }
      if (tierRaw) setBudgetTier(tierRaw);
      const first = Object.keys(newDay)[0];
      if (first) setSelectedDate(first);
    };

    checkRefresh().catch(() => {});
  }, []));

  const toggle = (doneState, setter, date, index) => {
    const cur = doneState[date] || [];
    const isCompleting = !cur.includes(index);
    setter(prev => {
      const current = prev[date] || [];
      return {
        ...prev,
        [date]: current.includes(index)
          ? current.filter(i => i !== index)
          : [...current, index],
      };
    });
    setPoints(p => Math.max(0, p + (isCompleting ? 10 : -10)));
  };

  const openProductModal = (stepIndex, category, isNight) =>
    setProductModal({ visible: true, dateStr: selectedDate, stepIndex, category, isNight });

  const selectProduct = (product) => {
    const { dateStr, stepIndex, isNight, category } = productModal;
    const cycleIdx = cycleIndexByDate[dateStr];
    const setter = isNight ? setNightByDate : setDayByDate;

    setter(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(d => {
        // Sin ciclo conocido para esta fecha: solo tocamos la fecha editada.
        if (cycleIdx == null ? d !== dateStr : cycleIndexByDate[d] !== cycleIdx) return;
        const steps = next[d];
        if (!steps?.[stepIndex] || steps[stepIndex].category !== category) return;
        next[d] = steps.map((s, i) => (i === stepIndex ? { ...s, product } : s));
      });
      return next;
    });

    // Persistimos el producto también en la plantilla del ciclo, para que se
    // mantenga elegido en regeneraciones futuras (cambio de presupuesto, etc.)
    if (cycleIdx != null) {
      setRoutinePlanByTier(prev => {
        if (!prev?.[budgetTier]?.[cycleIdx]) return prev;
        const key = isNight ? 'nightSteps' : 'daySteps';
        const tierPlan = prev[budgetTier].map((dayPlan, idx) => {
          if (idx !== cycleIdx) return dayPlan;
          const steps = dayPlan[key] || [];
          if (!steps[stepIndex]) return dayPlan;
          const newSteps = steps.map((s, i) =>
            i === stepIndex && typeof s === 'object' ? { ...s, product } : s
          );
          return { ...dayPlan, [key]: newSteps };
        });
        const updated = { ...prev, [budgetTier]: tierPlan };
        AsyncStorage.setItem('@mybeauty-calendar:diagnosisRoutinePlanByTier', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }

    setProductModal(p => ({ ...p, visible: false }));
  };

  const addUnplannedStep = (text, isNight) => {
    const setter = isNight ? setNightByDate : setDayByDate;
    setter(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), { text, editable: true }],
    }));
  };

  const handleDiaryPhoto = async () => {
    if (!user?.uid) return;
    const pick = async (fromCamera) => {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') return;
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.75 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.75 });
      if (result.canceled) return;
      try {
        setDiaryPhotoUploading(true);
        const url = await addProgressPhoto(user.uid, result.assets[0].uri, selectedDate);
        setDiaryPhotos(prev => [...prev, url]);
      } catch {
        Alert.alert('Error', 'No se pudo subir la foto.');
      } finally {
        setDiaryPhotoUploading(false);
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pick(true); if (idx === 2) pick(false); },
      );
    } else {
      Alert.alert('Agregar foto', '', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: () => pick(true) },
        { text: 'Elegir de galería', onPress: () => pick(false) },
      ]);
    }
  };

  const handlePlusPress = (isNight) => {
    setAddPickerModal({ visible: true, isNight });
  };

  const openStep = (isNight) => {
    setAddPickerModal({ visible: false, isNight: false });
    setStepName(''); setStepDesc('');
    setAddStepModal({ visible: true, isNight });
  };

  const openDiary = () => {
    setAddPickerModal({ visible: false, isNight: false });
    setDiaryHairFeel([]); setDiaryHydration(''); setDiaryScalp('');
    setDiaryHeat(null); setDiaryWashed(null); setDiaryNote('');
    setDiaryPhotos([]);
    setDiaryModal(true);
  };

  const saveDiary = async () => {
    if (!user?.uid) return;
    setDiarySaving(true);
    try {
      await saveDiaryEntry(user.uid, selectedDate, {
        hairFeel: diaryHairFeel,
        hydration: diaryHydration,
        scalp: diaryScalp,
        usedHeat: diaryHeat,
        washedHair: diaryWashed,
        note: diaryNote,
      });
      setDiaryModal(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el diario.');
    } finally {
      setDiarySaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 28 }}
      >
        {/* ── gradient header ── */}
        <View style={styles.headerWrap}>
          <BeautyCalendarHeader
            selectedDate={selectedDate}
            onDatePress={handleDatePress}
            markedDates={buildMarkedDates(dayByDate, nightByDate)}
            completedDates={buildCompletedDates(dayDone, nightDone)}
            streak={calcStreak(dayDone, nightDone, skippedDates)}
            points={points}
            expanded={calendarExpanded}
            onGridPress={() => setCalendarExpanded(e => !e)}
            onBellPress={openNotifModal}
            onStreakPress={() => setStreakModal(true)}
          />
        </View>

        {/* ── selector de presupuesto ── */}
        {routinePlanByTier && (
          <TouchableOpacity
            style={styles.budgetPill}
            activeOpacity={0.8}
            onPress={() => setBudgetModalVisible(true)}
          >
            <Text style={styles.budgetPillEmoji}>{PRICE_TIER_LABELS[budgetTier]?.emoji}</Text>
            <Text style={styles.budgetPillText}>Presupuesto: {PRICE_TIER_LABELS[budgetTier]?.label}</Text>
            <Ionicons name="chevron-down" size={14} color="#BF789C" />
          </TouchableOpacity>
        )}

        {/* ── motivational banner ── */}
        <View style={[styles.motivRow, { marginTop: 20, marginBottom: 24 }]}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.motivText}>{motText}</Text>
        </View>

        {/* ── clima ── */}
        {weather && (
          <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>
              {weather.condition === 'Rain' || weather.condition === 'Drizzle' ? '🌧️'
                : weather.condition === 'Clear' ? '☀️'
                : weather.condition === 'Snow' ? '❄️'
                : '🌤️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherCity}>{weather.city} · {weather.temp}°C · {weather.humidity}% humedad</Text>
              <Text style={styles.weatherTip}>{getWeatherHairTip(weather.flags)}</Text>
            </View>
          </View>
        )}

        {/* ── tip del día ── */}
        <View style={[styles.tipCard, { marginTop: 16 }]}>
          <View style={styles.tipCardTop}>
            <Text style={styles.tipLabel}>TIP DEL DÍA</Text>
            <TouchableOpacity
              onPress={() => setTipLiked(v => !v)}
              activeOpacity={0.7}
              style={styles.tipLike}
              accessibilityRole="button"
              accessibilityLabel="Me gusta este tip"
              accessibilityState={{ selected: tipLiked }}
            >
              <Ionicons
                name={tipLiked ? 'heart' : 'heart-outline'}
                size={17}
                color={tipLiked ? '#E8789A' : '#CCC'}
              />
              <Text style={[styles.tipLikeNum, tipLiked && { color: '#E8789A' }]}>
                {tipLiked ? 377 : 376}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tipText}>{tipText}</Text>
        </View>

        <View style={{ height: 8 }} />

        {/* ── DÍA ── */}
        <RoutineCard
          title="DÍA"
          iconName="sunny-outline"
          accentColor="#E8789A"
          routines={dayRoutines}
          completed={dayCompleted}
          onToggle={(i) => toggle(dayDone, setDayDone, selectedDate, i)}
          onPlusPress={() => handlePlusPress(false)}
          onNavigate={() =>
            navigation.navigate('ProductsModal', { routines: dayRoutines, date: selectedDate })
          }
          onProductPress={(i, cat) => openProductModal(i, cat, false)}
          onMenuPress={() => openRoutineMenu(false)}
          isSkipped={!!skippedDates[selectedDate]}
        />

        <View style={{ height: 16 }} />

        {/* ── NOCHE ── */}
        <RoutineCard
          title="NOCHE"
          iconName="moon-outline"
          accentColor="#7B61FF"
          routines={nightRoutines}
          completed={nightCompleted}
          onToggle={(i) => toggle(nightDone, setNightDone, selectedDate, i)}
          onPlusPress={() => handlePlusPress(true)}
          onNavigate={() =>
            navigation.navigate('ProductsModal', { routines: nightRoutines, date: selectedDate })
          }
          onProductPress={(i, cat) => openProductModal(i, cat, true)}
          onMenuPress={() => openRoutineMenu(true)}
          isSkipped={!!skippedDates[selectedDate]}
        />

        {/* ── MODAL SELECTOR DE PRODUCTO ── */}
        <Modal
          visible={productModal.visible}
          animationType="slide"
          transparent
          onRequestClose={() => setProductModal(p => ({ ...p, visible: false }))}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Elige un producto</Text>
              <Text style={styles.modalCategory}>{productModal.category}</Text>
              <Text style={styles.modalHint}>
                {hairProfile
                  ? 'Alternativas que también funcionan para tu diagnóstico. Se aplica cada vez que toque este paso en tu ciclo.'
                  : 'Se aplica cada vez que toque este paso en tu ciclo.'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {getMatchingProducts(productModalSource, productModal.category, hairProfile)
                  .map(product => {
                    const currentSteps = productModal.isNight
                      ? nightByDate[productModal.dateStr]
                      : dayByDate[productModal.dateStr];
                    const current = currentSteps?.[productModal.stepIndex]?.product;
                    const isCurrent = current?.id === product.id;
                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={[styles.modalProductRow, isCurrent && styles.modalProductRowActive]}
                        onPress={() => selectProduct(product)}
                        activeOpacity={0.75}
                      >
                        <ProductThumb index={0} product={product} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.modalProductBrand}>{product.brand}</Text>
                          <Text style={styles.modalProductName}>{product.name}</Text>
                        </View>
                        {isCurrent
                          ? <Ionicons name="checkmark-circle" size={18} color="#BF789C" />
                          : <Ionicons name="chevron-forward" size={16} color="#CCC" />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setProductModal(p => ({ ...p, visible: false }))}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Modal racha / progreso ── */}
        <Modal visible={streakModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={styles.streakModalBox}>
              {/* Header */}
              <View style={styles.streakModalHeader}>
                <View style={styles.streakPointsPill}>
                  <Ionicons name="bar-chart-outline" size={13} color="#BF789C" />
                  <Text style={styles.streakPointsText}>{points}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setStreakModal(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Número de racha */}
              <View style={styles.streakCenter}>
                <Text style={styles.streakBigIcon}>⚡</Text>
                <Text style={styles.streakBigNumber}>{calcStreak(dayDone, nightDone, skippedDates)}</Text>
                <Text style={styles.streakLabel}>
                  {calcStreak(dayDone, nightDone, skippedDates) === 1 ? 'DÍA CONSECUTIVO' : 'DÍAS CONSECUTIVOS'}
                </Text>
              </View>

              {/* Tarjetas días consecutivos */}
              <Text style={styles.streakSectionTitle}>DÍAS CONSECUTIVOS</Text>
              <View style={styles.streakCardsRow}>
                <View style={styles.streakCard}>
                  <Text style={styles.streakCardNumber}>{calcStreak(dayDone, nightDone, skippedDates)}</Text>
                  <Text style={styles.streakCardLabel}>de rutina</Text>
                </View>
                <View style={styles.streakCard}>
                  <Text style={styles.streakCardNumber}>0</Text>
                  <Text style={styles.streakCardLabel}>de diario</Text>
                </View>
              </View>

              {/* Resumen de pasos hoy */}
              <Text style={[styles.streakSectionTitle, { marginTop: 20 }]}>PASOS DE HOY</Text>
              <View style={styles.streakStatsList}>
                {[
                  {
                    label: 'Completados',
                    value: [
                      ...(dayDone[selectedDate] || []),
                      ...(nightDone[selectedDate] || []),
                    ].filter(Boolean).length,
                  },
                  {
                    label: 'Pendientes',
                    value: [
                      ...(dayDone[selectedDate] || []),
                      ...(nightDone[selectedDate] || []),
                    ].filter(v => !v).length,
                  },
                  {
                    label: 'Puntos acumulados',
                    value: points,
                  },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.streakStatRow}>
                    <Text style={styles.streakStatLabel}>{label}</Text>
                    <Text style={styles.streakStatValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Modal selector de presupuesto ── */}
        <Modal visible={budgetModalVisible} transparent animationType="slide" onRequestClose={() => setBudgetModalVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={styles.budgetModalBox}>
              <View style={styles.streakModalHeader}>
                <Text style={styles.budgetModalTitle}>Elige tu presupuesto</Text>
                <TouchableOpacity
                  onPress={() => setBudgetModalVisible(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>
              {['low', 'mid', 'high'].map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[styles.budgetOption, budgetTier === tier && styles.budgetOptionActive]}
                  activeOpacity={0.8}
                  onPress={() => switchBudgetTier(tier)}
                >
                  <Text style={styles.budgetOptionEmoji}>{PRICE_TIER_LABELS[tier].emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.budgetOptionLabel}>{PRICE_TIER_LABELS[tier].label}</Text>
                    {budgetTier === tier && <Text style={styles.budgetOptionHint}>Rutina actual</Text>}
                  </View>
                  {budgetTier === tier && <Ionicons name="checkmark-circle" size={20} color="#BF789C" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* ── Menú "..." de la rutina ── */}
        <Modal visible={routineMenu.visible} transparent animationType="fade" onRequestClose={() => setRoutineMenu(m => ({ ...m, visible: false }))}>
          <TouchableWithoutFeedback onPress={() => setRoutineMenu(m => ({ ...m, visible: false }))}>
            <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.actionSheetBox}>
                  <TouchableOpacity style={styles.actionSheetItem} activeOpacity={0.75} onPress={toggleSkipToday}>
                    <Ionicons name="moon-outline" size={18} color="#7B61FF" />
                    <Text style={styles.actionSheetText}>
                      {skippedDates[selectedDate] ? 'Deshacer descanso' : 'Saltar hoy'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      const isNight = routineMenu.isNight;
                      setRoutineMenu(m => ({ ...m, visible: false }));
                      setStepRemoveModal({ visible: true, isNight });
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#E8789A" />
                    <Text style={styles.actionSheetText}>Eliminar un paso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      setRoutineMenu(m => ({ ...m, visible: false }));
                      setWashPickerVisible(true);
                    }}
                  >
                    <Ionicons name="swap-horizontal-outline" size={18} color="#BF789C" />
                    <Text style={styles.actionSheetText}>Cambiar a otro lavado del ciclo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionSheetItem} activeOpacity={0.75} onPress={handleResetRoutine}>
                    <Ionicons name="refresh-outline" size={18} color="#7ADA7A" />
                    <Text style={styles.actionSheetText}>Restablecer rutina sugerida</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ── Modal selector de lavado del ciclo ── */}
        <Modal visible={washPickerVisible} transparent animationType="slide" onRequestClose={() => setWashPickerVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={styles.budgetModalBox}>
              <View style={styles.streakModalHeader}>
                <Text style={styles.budgetModalTitle}>Cambiar a otro lavado</Text>
                <TouchableOpacity
                  onPress={() => setWashPickerVisible(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {(routinePlanByTier?.[budgetTier] || []).map((dayPlan, idx) => {
                  const active = cycleIndexByDate[selectedDate] === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.budgetOption, active && styles.budgetOptionActive]}
                      activeOpacity={0.8}
                      onPress={() => handleChangeWash(idx)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.budgetOptionLabel}>{dayPlan.title || `Día ${idx + 1}`}</Text>
                        {active && <Text style={styles.budgetOptionHint}>Rutina actual</Text>}
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color="#BF789C" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Modal eliminar un paso ── */}
        <Modal visible={stepRemoveModal.visible} transparent animationType="slide" onRequestClose={() => setStepRemoveModal(m => ({ ...m, visible: false }))}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <View style={styles.budgetModalBox}>
              <View style={styles.streakModalHeader}>
                <Text style={styles.budgetModalTitle}>
                  Eliminar un paso · {stepRemoveModal.isNight ? 'Noche' : 'Día'}
                </Text>
                <TouchableOpacity
                  onPress={() => setStepRemoveModal(m => ({ ...m, visible: false }))}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {(stepRemoveModal.isNight ? nightRoutines : dayRoutines).map((item, i) => (
                  <View key={i} style={styles.modalProductRow}>
                    <Text style={{ flex: 1, fontSize: 14, color: '#333' }} numberOfLines={2}>
                      {typeof item === 'string' ? item : item.text}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeRoutineStep(stepRemoveModal.isNight, i)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar paso"
                    >
                      <Ionicons name="trash-outline" size={18} color="#E8789A" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Modal selector agregar ── */}
        <Modal visible={addPickerModal.visible} transparent animationType="fade" onRequestClose={() => setAddPickerModal({ visible: false, isNight: false })}>
          <TouchableWithoutFeedback onPress={() => setAddPickerModal({ visible: false, isNight: false })}>
            <View style={styles.pickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.pickerSheet}>
                  <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pickerTitleBar}>
                    <Text style={styles.pickerTitleText}>¿Qué quieres agregar?</Text>
                  </LinearGradient>
                  <TouchableOpacity style={styles.pickerOption} onPress={() => openStep(addPickerModal.isNight)} activeOpacity={0.75}>
                    <View style={styles.pickerOptionIcon}>
                      <Ionicons name="list-outline" size={22} color="#BF789C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerOptionTitle}>Agregar paso a la rutina</Text>
                      <Text style={styles.pickerOptionSub}>Añade un paso personalizado a tu rutina de {addPickerModal.isNight ? 'noche' : 'día'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#DDB4CC" />
                  </TouchableOpacity>
                  <View style={styles.pickerDivider} />
                  <TouchableOpacity style={styles.pickerOption} onPress={openDiary} activeOpacity={0.75}>
                    <View style={[styles.pickerOptionIcon, { backgroundColor: '#F0ECFF' }]}>
                      <Ionicons name="book-outline" size={22} color="#7B61FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerOptionTitle}>Diario del cabello</Text>
                      <Text style={styles.pickerOptionSub}>Registra cómo está tu cabello hoy</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#C0B8E8" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setAddPickerModal({ visible: false, isNight: false })}>
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ── Modal agregar paso ── */}
        <Modal visible={addStepModal.visible} transparent animationType="fade" onRequestClose={() => setAddStepModal(p => ({ ...p, visible: false }))}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableWithoutFeedback onPress={() => setAddStepModal({ visible: false, isNight: false })}>
              <View style={styles.pickerOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={[styles.pickerSheet, { paddingBottom: 20 }]}>
                    <Text style={styles.modalTitle}>Agregar paso a la rutina</Text>
                    <Text style={styles.modalCategory}>{addStepModal.isNight ? 'Rutina de noche' : 'Rutina de día'}</Text>
                    <TextInput
                      style={styles.stepInput}
                      placeholder="Nombre (ej. Mascarilla de proteína)"
                      placeholderTextColor="#CCC"
                      value={stepName}
                      onChangeText={setStepName}
                      autoFocus
                    />
                    <TextInput
                      style={[styles.stepInput, { marginTop: 10, minHeight: 72, textAlignVertical: 'top' }]}
                      placeholder="Descripción (opcional)"
                      placeholderTextColor="#CCC"
                      value={stepDesc}
                      onChangeText={setStepDesc}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.stepSaveBtn, !stepName.trim() && { opacity: 0.4 }]}
                      disabled={!stepName.trim()}
                      activeOpacity={0.85}
                      onPress={() => {
                        const text = stepDesc.trim() ? `${stepName.trim()}: ${stepDesc.trim()}` : stepName.trim();
                        addUnplannedStep(text, addStepModal.isNight);
                        setAddStepModal({ visible: false, isNight: false });
                      }}
                    >
                      <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stepSaveBtnGradient}>
                        <Text style={styles.stepSaveBtnText}>Agregar paso a la rutina</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalCancel} onPress={() => setAddStepModal({ visible: false, isNight: false })}>
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Modal diario ── */}
        <Modal visible={diaryModal} transparent animationType="slide" onRequestClose={() => setDiaryModal(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
              <Animated.View style={[styles.diarySheet, { transform: [{ translateY: diaryTranslateY }] }]}>
                <View style={styles.modalHandle} {...diaryPanResponder.panHandlers} />
                <View style={styles.diaryHeader}>
                  <Text style={styles.diaryTitle}>Diario del cabello</Text>
                  <Text style={styles.diaryDate}>{fmtDate(selectedDate)}</Text>
                  <TouchableOpacity
                    onPress={() => setDiaryModal(false)}
                    style={styles.diaryClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar diario"
                  >
                    <Ionicons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.diaryScroll} keyboardShouldPersistTaps="handled">

                  <Text style={styles.diaryQuestion}>¿Cómo se siente tu cabello hoy?</Text>
                  <ChipGroup options={DIARY_HAIR_FEEL} selected={diaryHairFeel} multi onSelect={setDiaryHairFeel} color="#E8789A" />

                  <View style={styles.diaryDivider} />

                  <Text style={styles.diaryQuestion}>Nivel de hidratación</Text>
                  <ChipGroup options={DIARY_HYDRATION} selected={diaryHydration} onSelect={setDiaryHydration} color="#BF789C" />

                  <Text style={[styles.diaryQuestion, { marginTop: 18 }]}>Cuero cabelludo</Text>
                  <ChipGroup options={DIARY_SCALP} selected={diaryScalp} onSelect={setDiaryScalp} color="#BF789C" />

                  <View style={styles.diaryDivider} />

                  <View style={styles.diaryYesNoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diaryQuestion}>¿Usaste calor?</Text>
                      <YesNo value={diaryHeat} onChange={setDiaryHeat} color="#7B61FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diaryQuestion}>¿Lavaste el cabello?</Text>
                      <YesNo value={diaryWashed} onChange={setDiaryWashed} color="#7B61FF" />
                    </View>
                  </View>

                  <View style={styles.diaryDivider} />

                  <Text style={styles.diaryQuestion}>Nota libre (opcional)</Text>
                  <TextInput
                    style={styles.diaryNoteInput}
                    placeholder="¿Algo más sobre tu cabello hoy?"
                    placeholderTextColor="#CCC"
                    value={diaryNote}
                    onChangeText={setDiaryNote}
                    multiline
                    maxLength={200}
                  />

                  <View style={styles.diaryDivider} />

                  <Text style={styles.diaryQuestion}>Fotos del cabello</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diaryPhotosRow}>
                    {diaryPhotos.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={styles.diaryPhotoThumb} />
                    ))}
                    <TouchableOpacity
                      style={styles.diaryPhotoAdd}
                      onPress={handleDiaryPhoto}
                      disabled={diaryPhotoUploading}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar foto"
                      accessibilityState={{ disabled: diaryPhotoUploading }}
                    >
                      {diaryPhotoUploading
                        ? <ActivityIndicator size="small" color="#BF789C" />
                        : <Ionicons name="camera-outline" size={26} color="#D6A4A4" />}
                    </TouchableOpacity>
                  </ScrollView>

                  <TouchableOpacity style={styles.stepSaveBtn} activeOpacity={0.85} onPress={saveDiary} disabled={diarySaving}>
                    <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stepSaveBtnGradient}>
                      <Text style={styles.stepSaveBtnText}>{diarySaving ? 'Guardando...' : 'Guardar en el diario'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                </ScrollView>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Modal notificaciones ── */}
        <Modal visible={notifModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Notificaciones programadas</Text>
              {scheduledNotifs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                  <Ionicons name="notifications-off-outline" size={40} color="#D6A4A4" />
                  <Text style={{ color: '#BBB', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                    No hay notificaciones programadas.{'\n'}Activa los permisos en ajustes.
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {scheduledNotifs.map((n) => (
                    <View key={n.identifier} style={styles.modalProductRow}>
                      <Ionicons name="notifications-outline" size={18} color="#D6A4A4" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalProductName}>{n.content.title}</Text>
                        <Text style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>{n.content.body}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNotifModal(false)}>
                <Text style={styles.modalCancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

