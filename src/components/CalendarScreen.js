import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BeautyCalendarHeader from './BeautyCalendarHeader';
import { fetchProductsByProfile } from '../firebase/products';
import { getWeatherContext, getWeatherBoostTags, getWeatherHairTip } from '../services/weatherService';

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

function getProductForStep(stepText, products) {
  const category = getCategoryForStep(stepText);
  if (!category) return null;
  return products.find(p => p.category === category) ?? null;
}

// ─── sub-components ───────────────────────────────────────────────────────────

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
        <Text style={styles.routineItemText} numberOfLines={2}>
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

function RoutineCard({ title, iconName, accentColor, routines, completed, onToggle, onAdd, onNavigate, onProductPress }) {
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft]         = useState('');

  const total      = routines.length;
  const done       = completed.length;
  const isAllDone  = total > 0 && done === total;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: total > 0 ? done / total : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  }, [done, total]);

  const handleSave = () => {
    const t = draft.trim();
    if (t) { onAdd(t); setDraft(''); setShowInput(false); }
  };

  return (
    <View style={styles.routineCard}>
      {/* section header */}
      <View style={styles.routineCardHeader}>
        <Ionicons name={iconName} size={15} color={accentColor} style={{ marginRight: 6 }} />
        <Text style={[styles.routineCardTitle, { color: accentColor }]}>{title}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onNavigate} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* MI RUTINA label + progreso */}
      <View style={styles.myRoutineRow}>
        <Ionicons name="sparkles" size={13} color={accentColor} />
        <Text style={[styles.myRoutineText, { color: accentColor }]}>MI RUTINA</Text>
        {total > 0 && (
          <Text style={[styles.progressCount, { color: accentColor }]}>{done}/{total}</Text>
        )}
      </View>

      {/* barra de progreso */}
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

      {/* items */}
      {routines.map((item, i) => {
        const stepText = typeof item === 'string' ? item : item.text;
        const category = getCategoryForStep(stepText);
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

      {/* inline input */}
      {showInput && (
        <TextInput
          placeholder="Ej. Shampoo + mascarilla"
          placeholderTextColor="#CCC"
          value={draft}
          onChangeText={setDraft}
          style={[styles.inlineInput, { borderColor: accentColor + '55' }]}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      )}

      {/* banner de completado */}
      {isAllDone && (
        <View style={[styles.completionBanner, { borderColor: accentColor + '55' }]}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={[styles.completionText, { color: accentColor }]}>¡Rutina completa! Sigue así</Text>
        </View>
      )}

      {/* Fila inferior: agregar paso + ir a productos */}
      <View style={[styles.addRow, { borderTopColor: accentColor + '22' }]}>
        <TouchableOpacity style={styles.addRowLeft} onPress={() => setShowInput(v => !v)}>
          <Ionicons name="add-circle-outline" size={17} color={accentColor} />
          <Text style={[styles.addRowText, { color: accentColor }]}>Agregar paso</Text>
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

export default function CalendarScreen({ route, navigation }) {
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
  const isLoaded = useRef(false);

  // ── Carga desde AsyncStorage al montar ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [d, n, dd, nd] = await Promise.all([
          AsyncStorage.getItem('@mybeauty-calendar:dayByDate'),
          AsyncStorage.getItem('@mybeauty-calendar:nightByDate'),
          AsyncStorage.getItem('@mybeauty-calendar:dayDone'),
          AsyncStorage.getItem('@mybeauty-calendar:nightDone'),
        ]);
        const pts = await AsyncStorage.getItem('@mybeauty-calendar:points');
        if (d)   setDayByDate(JSON.parse(d));
        if (n)   setNightByDate(JSON.parse(n));
        if (dd)  setDayDone(JSON.parse(dd));
        if (nd)  setNightDone(JSON.parse(nd));
        if (pts) setPoints(JSON.parse(pts));
      } catch {}
      isLoaded.current = true;
    };
    load();
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

        newDay[dateStr]   = (dayPlan.daySteps   || []).map(s => ({ text: s, editable: false, product: getProductForStep(s, products) }));
        newNight[dateStr] = (dayPlan.nightSteps || []).map(s => ({ text: s, editable: false, product: getProductForStep(s, products) }));
      }

      setProfileProducts(products);
      setDayByDate(newDay);
      setNightByDate(newNight);
      const first = Object.keys(newDay)[0];
      if (first) setSelectedDate(first);
    };

    init();
  }, [route]);

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

  const getFormattedDate = () =>
    dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

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

  const addRoutine = (setter, date, text) =>
    setter(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), { text, editable: true }],
    }));

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
          />
        </View>

        {/* ── date label ── */}
        <Text style={styles.dateLabel}>{getFormattedDate()}</Text>

        {/* ── streak + puntos ── */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statText}>{calcStreak()} {calcStreak() === 1 ? 'día' : 'días'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statText}>{points} pts</Text>
          </View>
        </View>

        {/* ── motivational banner ── */}
        <View style={styles.motivRow}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.motivText}>{motText}</Text>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={13} color="#C47898" />
          </TouchableOpacity>
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
        <View style={styles.tipCard}>
          <View style={styles.tipCardTop}>
            <Text style={styles.tipLabel}>TIP DEL DÍA</Text>
            <View style={styles.tipLike}>
              <Ionicons name="heart-outline" size={15} color="#CCC" />
              <Text style={styles.tipLikeNum}>376</Text>
            </View>
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
          onAdd={(t) => addRoutine(setDayByDate, selectedDate, t)}
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
          onAdd={(t) => addRoutine(setNightByDate, selectedDate, t)}
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#F0EAFF',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#9B7FC7',
    marginBottom: 3,
  },
  weatherTip: {
    fontSize: 12,
    color: '#6B4FA0',
    fontWeight: '500',
    lineHeight: 17,
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
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
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
    fontSize: 13,
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
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },
  routineItemLabel: {
    fontWeight: '700',
  },
  routineItemBrand: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // add step
  inlineInput: {
    backgroundColor: '#FBF5F8',
    borderRadius: 10,
    padding: 11,
    fontSize: 13,
    borderWidth: 1,
    marginBottom: 10,
    color: '#333',
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
    fontSize: 13,
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
});
