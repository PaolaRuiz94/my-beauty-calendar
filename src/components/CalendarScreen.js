import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BeautyCalendarHeader from './BeautyCalendarHeader';
import { fetchProductsByProfile } from '../firebase/products';
import { getWeatherContext, getWeatherBoostTags, getWeatherHairTip } from '../services/weatherService';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../auth/AuthContext';
import { saveDiaryEntry } from '../firebase/diary';
import { addProgressPhoto } from '../firebase/progressPhotos';
import * as ImagePicker from 'expo-image-picker';

// ─── static content ──────────────────────────────────────────────────────────

const TIPS = [
  'Usar demasiados productos a la vez puede causar congestión y sensibilidad en el cuero cabelludo (cuando no combinan bien). Asegúrate de conocer tu rutina ideal.',
  'Lavar el cabello con agua fría ayuda a sellar la cutícula y aporta más brillo natural.',
  'El masaje capilar estimula la circulación y favorece el crecimiento del cabello.',
  'Dormir con el cabello húmedo puede causar frizz y rotura. Déjalo secar antes de acostarte.',
  'Los aceites se aplican al final de la rutina para sellar la hidratación, no antes.',
  'Evita el calor excesivo: si usas secador, aplica protector térmico siempre.',
  'La frecuencia de lavado depende de tu tipo de cabello; no hay una regla universal.',
];

const MOTIVATIONS = [
  'Hoy es un buen día para cuidar de tu cabello',
  'Tu cabello te lo agradecerá ✨',
  'Pequeños hábitos, grandes resultados',
  'Cuídate hoy, brilla mañana',
  'Tu rutina es tu momento de autocuidado',
  'Cada paso cuenta en tu transformación capilar',
  'Hoy es el día perfecto para mimar tu cabello',
];

const THUMB_GRADIENTS = [
  ['#FFD6E0', '#FFAFC5'],
  ['#C8F7C5', '#96E4A1'],
  ['#C5D8FF', '#A0BEFF'],
  ['#FFE5C5', '#FFD0A0'],
  ['#E5C5FF', '#C8A0FF'],
  ['#C5FFEE', '#A0FFDA'],
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function getCategoryForStep(stepText) {
  const t = stepText.toLowerCase();
  if (t.includes('shampoo'))                                                              return 'Shampoo';
  if (t.includes('acondicionador'))                                                       return 'Acondicionador';
  if (t.includes('mascarilla') || t.includes('proteico') || t.includes('tratamiento'))   return 'Tratamiento';
  if (t.includes('aceite'))                                                               return 'Aceites';
  if (t.includes('crema') || t.includes('leave-in') || t.includes('loc') || t.includes('lco')) return 'Crema de Peinar';
  if (t.includes('gel'))                                                                  return 'Gel';
  if (t.includes('mousse') || t.includes('espuma'))                                      return 'Espumas';
  return null;
}


// ─── sub-components ───────────────────────────────────────────────────────────

function ChipGroup({ options, selected, multi = false, onSelect, color = '#BF789C' }) {
  return (
    <View style={styles.chipGroup}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
            onPress={() => {
              if (multi) onSelect(active ? selected.filter(s => s !== opt) : [...selected, opt]);
              else onSelect(active ? '' : opt);
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function YesNo({ value, onChange, color = '#BF789C' }) {
  return (
    <View style={styles.yesNoRow}>
      {[true, false].map(v => (
        <TouchableOpacity
          key={String(v)}
          style={[styles.yesNoBtn, value === v && { backgroundColor: color, borderColor: color }]}
          onPress={() => onChange(value === v ? null : v)}
          activeOpacity={0.75}
        >
          <Text style={[styles.yesNoBtnText, value === v && styles.yesNoBtnTextActive]}>
            {v ? 'Sí' : 'No'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ProductThumb({ index }) {
  const colors = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <LinearGradient colors={colors} style={styles.productThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
  );
}

function RoutineItem({ item, index, isCompleted, onToggle, accentColor, onProductPress }) {
  const raw = typeof item === 'string' ? item : item.text;
  const colonIdx = raw.indexOf(':');
  const label = colonIdx !== -1 ? raw.slice(0, colonIdx).trim() : '';
  const name  = colonIdx !== -1 ? raw.slice(colonIdx + 1).trim() : raw;
  const product = typeof item === 'object' ? item.product : undefined;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.5, useNativeDriver: true, friction: 3, tension: 300 }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, friction: 5, tension: 200 }),
    ]).start();
    onToggle();
  };

  return (
    <View style={styles.routineItem}>
      <ProductThumb index={index} />
      <View style={styles.routineItemContent}>
        <Text style={styles.routineItemText}>
          {label
            ? <Text style={styles.routineItemLabel}>{index + 1}. {label}: </Text>
            : <Text style={styles.routineItemLabel}>{index + 1}. </Text>}
          {name}
        </Text>
        {product ? (
          <TouchableOpacity onPress={onProductPress} activeOpacity={0.7} disabled={!onProductPress}>
            <Text style={styles.routineItemBrand} numberOfLines={1}>
              ✦ {product.brand} — {product.name}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity onPress={handleToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={26}
            color={isCompleted ? accentColor : '#DDD'}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function RoutineCard({ title, iconName, accentColor, routines, completed, onToggle, onNavigate, onProductPress, onPlusPress }) {
  const total     = routines.length;
  const done      = completed.length;
  const isAllDone = total > 0 && done === total;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: total > 0 ? done / total : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  }, [done, total]);

  return (
    <View style={styles.routineCard}>
      <View style={styles.routineCardHeader}>
        <Ionicons name={iconName} size={15} color={accentColor} style={{ marginRight: 6 }} />
        <Text style={[styles.routineCardTitle, { color: accentColor }]}>{title}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onNavigate} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#CCC" />
        </TouchableOpacity>
      </View>

      <View style={styles.myRoutineRow}>
        <Ionicons name="sparkles" size={13} color={accentColor} />
        <Text style={[styles.myRoutineText, { color: accentColor }]}>MI RUTINA</Text>
        {total > 0 && (
          <Text style={[styles.progressCount, { color: accentColor }]}>{done}/{total}</Text>
        )}
      </View>

      {total > 0 && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: isAllDone ? '#7ADA7A' : accentColor,
            }]}
          />
        </View>
      )}

      {routines.map((item, i) => {
        const category = typeof item === 'object' ? (item.category || null) : null;
        return (
          <RoutineItem
            key={i}
            item={item}
            index={i}
            isCompleted={completed.includes(i)}
            onToggle={() => onToggle(i)}
            accentColor={accentColor}
            onProductPress={category ? () => onProductPress(i, category) : null}
          />
        );
      })}

      {isAllDone && (
        <View style={[styles.completionBanner, { borderColor: accentColor + '55' }]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={[styles.completionText, { color: accentColor }]}>¡Rutina completa! Sigue así</Text>
        </View>
      )}

      <View style={[styles.addRow, { borderTopColor: accentColor + '22' }]}>
        <TouchableOpacity style={styles.addRowLeft} onPress={onPlusPress} activeOpacity={0.75}>
          <View style={[styles.plusBtn, { backgroundColor: accentColor + '18', borderColor: accentColor + '44' }]}>
            <Ionicons name="add" size={18} color={accentColor} />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.squareBtn, { borderColor: accentColor + '88' }]}
          onPress={onNavigate}
        >
          <Ionicons name="bag-handle-outline" size={16} color={accentColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

const DIARY_HAIR_FEEL = ['Brilloso', 'Opaco', 'Suave', 'Reseco', 'Con frizz', 'Definido', 'Esponjado', 'Normal'];
const DIARY_HYDRATION = ['Muy hidratado', 'Hidratado', 'Normal', 'Reseco', 'Muy reseco'];
const DIARY_SCALP     = ['Normal', 'Graso', 'Reseco', 'Con picazón'];

const MONTH_NAMES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} de ${MONTH_NAMES_SHORT[parseInt(m) - 1]}`;
}

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
              const today = new Date();
              const newDay = {};
              const newNight = {};
              for (let i = 0; i < 30; i++) {
                const dateObj = new Date(today);
                dateObj.setDate(today.getDate() + i);
                const dateStr = dateObj.toISOString().split('T')[0];
                const dayPlan = i % 14 === 0 ? plan[0] : plan[i % plan.length];
                newDay[dateStr]   = (dayPlan.daySteps   || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
                newNight[dateStr] = (dayPlan.nightSteps || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
              }
              setProfileProducts(products);
              setDayByDate(newDay);
              setNightByDate(newNight);
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
    AsyncStorage.setItem('@mybeauty-calendar:points', JSON.stringify(points)).catch(() => {});
  }, [points]);

  const handleDatePress = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const dayRoutines   = dayByDate[selectedDate]   || [];
  const nightRoutines = nightByDate[selectedDate]  || [];
  const dayCompleted  = dayDone[selectedDate]      || [];
  const nightCompleted= nightDone[selectedDate]    || [];

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

      const today = new Date();
      const newDay   = {};
      const newNight = {};

      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayPlan = i % 14 === 0 ? plan[0] : plan[i % plan.length];

        newDay[dateStr]   = (dayPlan.daySteps   || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
        newNight[dateStr] = (dayPlan.nightSteps || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
      }

      setProfileProducts(products);
      setDayByDate(newDay);
      setNightByDate(newNight);
      const first = Object.keys(newDay)[0];
      if (first) setSelectedDate(first);
    };

    init();
  }, [route]);

  // Repoblar calendario cuando el diagnóstico se completa (flag en AsyncStorage)
  useFocusEffect(useCallback(() => {
    const checkRefresh = async () => {
      const flag = await AsyncStorage.getItem('@mybeauty-calendar:calendarNeedsRefresh');
      if (flag !== 'true') return;

      await AsyncStorage.removeItem('@mybeauty-calendar:calendarNeedsRefresh');

      const [planRaw, profileRaw] = await Promise.all([
        AsyncStorage.getItem('@mybeauty-calendar:diagnosisRoutinePlan'),
        AsyncStorage.getItem('@mybeauty-calendar:hairProfile'),
      ]);
      if (!planRaw) return;
      const plan = JSON.parse(planRaw);
      if (!Array.isArray(plan) || plan.length === 0) return;

      let products = [];
      try {
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          const flags = Object.entries(profile).filter(([, v]) => v === true).map(([k]) => k);
          products = await fetchProductsByProfile(flags);
        }
      } catch {}

      const today = new Date();
      const newDay = {};
      const newNight = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayPlan = i % 14 === 0 ? plan[0] : plan[i % plan.length];
        newDay[dateStr]   = (dayPlan.daySteps   || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
        newNight[dateStr] = (dayPlan.nightSteps || []).map(s => {
                  const text = typeof s === 'string' ? s : s.text;
                  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
                  const product = category ? (products.find(p => p.category === category) ?? null) : null;
                  return { text, editable: false, category, product };
                });
      }

      setProfileProducts(products);
      setDayByDate(newDay);
      setNightByDate(newNight);
      setDayDone({});
      setNightDone({});
      const first = Object.keys(newDay)[0];
      if (first) setSelectedDate(first);
    };

    checkRefresh().catch(() => {});
  }, []));


  const buildMarkedDates = () => {
    const out = {};
    Object.keys(dayByDate).forEach(d => {
      if (dayByDate[d]?.length) out[d] = true;
    });
    return out;
  };

  const buildCompletedDates = () => {
    const out = {};
    const allDates = new Set([...Object.keys(dayDone), ...Object.keys(nightDone)]);
    allDates.forEach(d => {
      if (dayDone[d]?.length > 0 || nightDone[d]?.length > 0) out[d] = true;
    });
    return out;
  };

  const calcStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    const todayActive = (dayDone[today]?.length > 0) || (nightDone[today]?.length > 0);
    if (todayActive) streak++;
    const base = new Date();
    for (let i = 1; i < 365; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const active = (dayDone[dateStr]?.length > 0) || (nightDone[dateStr]?.length > 0);
      if (active) streak++;
      else break;
    }
    return streak;
  };

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
    const { dateStr, stepIndex, isNight } = productModal;
    const setter = isNight ? setNightByDate : setDayByDate;
    setter(prev => {
      const steps = [...(prev[dateStr] || [])];
      steps[stepIndex] = { ...steps[stepIndex], product };
      return { ...prev, [dateStr]: steps };
    });
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
            markedDates={buildMarkedDates()}
            completedDates={buildCompletedDates()}
            streak={calcStreak()}
            points={points}
            expanded={calendarExpanded}
            onGridPress={() => setCalendarExpanded(e => !e)}
            onBellPress={openNotifModal}
            onStreakPress={() => setStreakModal(true)}
          />
        </View>

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
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {profileProducts
                  .filter(p => p.category === productModal.category)
                  .map(product => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.modalProductRow}
                      onPress={() => selectProduct(product)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalProductBrand}>{product.brand}</Text>
                        <Text style={styles.modalProductName}>{product.name}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#CCC" />
                    </TouchableOpacity>
                  ))}
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
                <TouchableOpacity onPress={() => setStreakModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Número de racha */}
              <View style={styles.streakCenter}>
                <Text style={styles.streakBigIcon}>⚡</Text>
                <Text style={styles.streakBigNumber}>{calcStreak()}</Text>
                <Text style={styles.streakLabel}>
                  {calcStreak() === 1 ? 'DÍA CONSECUTIVO' : 'DÍAS CONSECUTIVOS'}
                </Text>
              </View>

              {/* Tarjetas días consecutivos */}
              <Text style={styles.streakSectionTitle}>DÍAS CONSECUTIVOS</Text>
              <View style={styles.streakCardsRow}>
                <View style={styles.streakCard}>
                  <Text style={styles.streakCardNumber}>{calcStreak()}</Text>
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
                  <TouchableOpacity onPress={() => setDiaryModal(false)} style={styles.diaryClose}>
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

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },
  headerWrap: {},

  // streak + points
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 15,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C47898',
  },

  // date + motivation
  dateLabel: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#C47898',
    textTransform: 'capitalize',
  },
  motivRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 16,
    gap: 8,
  },
  sparkle: {
    color: '#7B61FF',
    fontSize: 15,
  },
  motivText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDEAF2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // weather banner
  weatherCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF5C2',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherIcon: {
    fontSize: 26,
  },
  weatherCity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A6B00',
    marginBottom: 3,
  },
  weatherTip: {
    fontSize: 13,
    color: '#6B5200',
    fontWeight: '500',
    lineHeight: 18,
  },

  // tip card
  tipCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8789A',
    letterSpacing: 0.8,
  },
  tipLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipLikeNum: {
    fontSize: 12,
    color: '#BBB',
    fontWeight: '500',
  },
  tipText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },

  // routine card
  routineCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  routineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routineCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  progressCount: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F3ECF0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6FFF6',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  completionEmoji: {
    fontSize: 18,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '700',
  },

  myRoutineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  myRoutineText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // routine item
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  productThumb: {
    width: 44,
    height: 56,
    borderRadius: 10,
  },
  routineItemContent: {
    flex: 1,
  },
  routineItemText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  routineItemLabel: {
    fontWeight: '700',
  },
  routineItemBrand: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 2,
  },
  addRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  squareBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // product selector modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  modalProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0F3',
  },
  modalProductBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalCancel: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F7F0F4',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BF789C',
  },

  centerBtn: {
    alignSelf: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },

  // + button
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // add step modal
  stepInput: {
    backgroundColor: '#FBF5F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#F0E0E8',
  },
  stepSaveBtn: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stepSaveBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  stepSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // diary modal
  diarySheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  diaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D2D2D',
    flex: 1,
  },
  diaryDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D6A4A4',
  },
  diaryClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaryScroll: {
    paddingBottom: 16,
  },
  diaryQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  diaryDivider: {
    height: 1,
    backgroundColor: '#F5E8EC',
    marginVertical: 18,
  },
  diaryYesNoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  diaryNoteInput: {
    backgroundColor: '#FBF5F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#F0E0E8',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // diary photos
  diaryPhotosRow: {
    gap: 10,
    paddingBottom: 4,
  },
  diaryPhotoThumb: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5E8EC',
  },
  diaryPhotoAdd: {
    width: 80,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8D0D8',
    borderStyle: 'dashed',
    backgroundColor: '#FDF5F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // chips
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#E8D0D8',
    backgroundColor: '#FDF5F8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  chipTextActive: {
    color: '#fff',
  },

  // yes/no
  yesNoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yesNoBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8D0D8',
    backgroundColor: '#FDF5F8',
    alignItems: 'center',
  },
  yesNoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  yesNoBtnTextActive: {
    color: '#fff',
  },

  // picker modal (selector agregar)
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerSheet: {
    backgroundColor: '#FDF5F8',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitleBar: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  pickerTitleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  pickerOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FDEAF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  pickerOptionSub: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
  },
  pickerDivider: {
    height: 1,
    backgroundColor: '#F0E0E8',
    marginVertical: 2,
  },

  // streak modal
  streakModalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    height: '82%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    shadowColor: '#BF789C',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  streakModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakPointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF0F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakPointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BF789C',
  },
  streakCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  streakBigIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  streakBigNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#2D2D2D',
    lineHeight: 72,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CCC',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  streakSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  streakCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#FDF5F8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  streakCardNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  streakCardLabel: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
    marginTop: 2,
  },
  streakStatsList: {
    backgroundColor: '#FDF5F8',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  streakStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBF0',
  },
  streakStatLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  streakStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#BF789C',
  },
});
