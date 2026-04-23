import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import BeautyCalendarHeader from './BeautyCalendarHeader';

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

// ─── sub-components ───────────────────────────────────────────────────────────

function ProductThumb({ index }) {
  const colors = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
  return (
    <LinearGradient colors={colors} style={styles.productThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
  );
}

function RoutineItem({ item, index, isCompleted, onToggle, accentColor }) {
  const raw = typeof item === 'string' ? item : item.text;
  const colonIdx = raw.indexOf(':');
  const label = colonIdx !== -1 ? raw.slice(0, colonIdx).trim() : '';
  const name  = colonIdx !== -1 ? raw.slice(colonIdx + 1).trim() : raw;
  const brand = typeof item === 'object' ? item.brand : undefined;

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
        {brand ? <Text style={styles.routineItemBrand}>{brand}</Text> : null}
      </View>
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={isCompleted ? accentColor : '#DDD'}
        />
      </TouchableOpacity>
    </View>
  );
}

function RoutineCard({ title, iconName, accentColor, routines, completed, onToggle, onAdd, onNavigate }) {
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft]         = useState('');

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

      {/* MI RUTINA label */}
      <View style={styles.myRoutineRow}>
        <Ionicons name="sparkles" size={13} color={accentColor} />
        <Text style={[styles.myRoutineText, { color: accentColor }]}>MI RUTINA</Text>
      </View>

      {/* items */}
      {routines.map((item, i) => (
        <RoutineItem
          key={i}
          item={item}
          index={i}
          isCompleted={completed.includes(i)}
          onToggle={() => onToggle(i)}
          accentColor={accentColor}
        />
      ))}

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

      {/* Agregar paso row */}
      <View style={[styles.addRow, { borderTopColor: accentColor + '22' }]}>
        <TouchableOpacity style={styles.addRowLeft} onPress={() => setShowInput(v => !v)}>
          <Ionicons name="add-circle-outline" size={17} color={accentColor} />
          <Text style={[styles.addRowText, { color: accentColor }]}>Agregar paso</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.squareBtn, { borderColor: accentColor + '88' }]}
          onPress={() => setShowInput(v => !v)}
        >
          <Ionicons name="add" size={15} color={accentColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.squareBtn, { borderColor: accentColor + '88', marginLeft: 8 }]}
          onPress={onNavigate}
        >
          <Text style={{ fontSize: 13 }}>🏁</Text>
        </TouchableOpacity>
      </View>

      {/* centered + button */}
      <TouchableOpacity
        style={[styles.centerBtn, { borderColor: accentColor + '88' }]}
        onPress={() => setShowInput(v => !v)}
      >
        <Ionicons name="add" size={20} color={accentColor} />
      </TouchableOpacity>
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

    const today = new Date();
    const newDay   = {};
    const newNight = {};

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // plan[0] es siempre el detox — se aplica el día 1 y cada 14 días
      const dayPlan = i % 14 === 0 ? plan[0] : plan[i % plan.length];

      newDay[dateStr]   = (dayPlan.daySteps   || []).map(s => ({ text: s, editable: false }));
      newNight[dateStr] = (dayPlan.nightSteps || []).map(s => ({ text: s, editable: false }));
    }

    setDayByDate(newDay);
    setNightByDate(newNight);
    const first = Object.keys(newDay)[0];
    if (first) setSelectedDate(first);
  }, [route]);

  const buildMarkedDates = () => {
    const out = {};
    Object.keys(dayByDate).forEach(d => {
      if (dayByDate[d]?.length) out[d] = true;
    });
    return out;
  };

  const getFormattedDate = () =>
    dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  const toggle = (setter, date, index) =>
    setter(prev => {
      const cur = prev[date] || [];
      return {
        ...prev,
        [date]: cur.includes(index) ? cur.filter(i => i !== index) : [...cur, index],
      };
    });

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
            streak={1}
            points={50}
            expanded={calendarExpanded}
            onGridPress={() => setCalendarExpanded(e => !e)}
          />
        </View>

        {/* ── date label ── */}
        <Text style={styles.dateLabel}>{getFormattedDate()}</Text>

        {/* ── motivational banner ── */}
        <View style={styles.motivRow}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.motivText}>{motText}</Text>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={13} color="#C47898" />
          </TouchableOpacity>
        </View>

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
          onToggle={(i) => toggle(setDayDone, selectedDate, i)}
          onAdd={(t) => addRoutine(setDayByDate, selectedDate, t)}
          onNavigate={() =>
            navigation.navigate('ProductsModal', { routines: dayRoutines, date: selectedDate })
          }
        />

        <View style={{ height: 16 }} />

        {/* ── NOCHE ── */}
        <RoutineCard
          title="NOCHE"
          iconName="moon-outline"
          accentColor="#7B61FF"
          routines={nightRoutines}
          completed={nightCompleted}
          onToggle={(i) => toggle(setNightDone, selectedDate, i)}
          onAdd={(t) => addRoutine(setNightByDate, selectedDate, t)}
          onNavigate={() =>
            navigation.navigate('ProductsModal', { routines: nightRoutines, date: selectedDate })
          }
        />
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
