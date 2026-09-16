import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 18;
const CELL_W = Math.floor((SCREEN_WIDTH - H_PAD * 2) / 7);

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const TODAY = new Date().toISOString().split('T')[0];

function getWeekDays(selectedDate) {
  const base = new Date(selectedDate + 'T12:00:00');
  const dow = base.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + toMonday + i);
    const dateStr = d.toISOString().split('T')[0];
    return { dateStr, label: DAY_LABELS[i], number: d.getDate() };
  });
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const offset   = startDow === 0 ? 6 : startDow - 1;
  const days = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({ dateStr: `${year}-${mm}-${dd}`, number: d });
  }
  return days;
}

function DayCell({ day, isSelected, isMarked, isCompleted, isToday, onPress, animValue }) {
  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const circleOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const dotOpacity = animValue.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.dayCell}>
      <Text style={[
        styles.dayLabel,
        isSelected && styles.dayLabelSelected,
        isToday && !isSelected && styles.dayLabelToday,
      ]}>
        {day.label}
      </Text>
      <Animated.View style={[styles.dayCircleWrap, { transform: [{ scale }] }]}>
        {/* selected: white fill */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.dayCircleSelected, { opacity: circleOpacity }]}
        />
        {/* completed (not selected): butter yellow fill */}
        {isCompleted && !isSelected && (
          <View style={[StyleSheet.absoluteFill, styles.dayCircleCompleted]} />
        )}
        {/* today (not selected, not completed): white ring border */}
        {isToday && !isSelected && !isCompleted && (
          <View style={[StyleSheet.absoluteFill, styles.dayCircleToday]} />
        )}
        {/* today + completed: show ring on top of yellow */}
        {isToday && !isSelected && isCompleted && (
          <View style={[StyleSheet.absoluteFill, styles.dayCircleTodayRing]} />
        )}
        <Text style={[
          styles.dayNumber,
          isSelected && styles.dayNumberSelected,
          isCompleted && !isSelected && styles.dayNumberCompleted,
          isToday && !isSelected && styles.dayNumberToday,
        ]}>
          {day.number}
        </Text>
      </Animated.View>
      <View style={styles.indicatorRow}>
        {isSelected ? (
          <Animated.View style={[styles.selectedDot, { opacity: dotOpacity }]} />
        ) : isCompleted ? (
          <View style={styles.completedDot} />
        ) : isToday ? (
          <View style={styles.todayDot} />
        ) : isMarked ? (
          <View style={styles.markedDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function MonthDayCell({ day, isSelected, isMarked, isCompleted, isToday, onPress }) {
  if (!day) return <View style={styles.monthCell} />;
  return (
    <TouchableOpacity
      style={styles.monthCell}
      onPress={() => onPress(day.dateStr)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.monthCellInner,
        isCompleted && !isSelected && styles.monthCellCompleted,
        isMarked && !isSelected && !isCompleted && styles.monthCellMarked,
        isSelected && styles.monthCellSelected,
        isToday && !isSelected && styles.monthCellToday,
      ]}>
        <Text style={[
          styles.monthCellNum,
          isCompleted && !isSelected && styles.monthCellNumCompleted,
          isMarked && !isSelected && !isCompleted && styles.monthCellNumMarked,
          isSelected && styles.monthCellNumSelected,
          isToday && !isSelected && styles.monthCellNumToday,
        ]}>
          {day.number}
        </Text>
        {isCompleted && !isSelected && <View style={styles.monthCompletedDot} />}
      </View>
    </TouchableOpacity>
  );
}

export default function BeautyCalendarHeader({
  selectedDate,
  onDatePress,
  markedDates = {},
  completedDates = {},
  streak = 1,
  points = 50,
  onBellPress,
  onStreakPress,
  onGridPress,
  expanded = false,
}) {
  const insets = useSafeAreaInsets();
  const weekDays = getWeekDays(selectedDate);

  const [viewYear,  setViewYear]  = useState(() => new Date(selectedDate + 'T12:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate + 'T12:00:00').getMonth());

  const animValues = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = weekDays.map((day, i) =>
      Animated.spring(animValues[i], {
        toValue: day.dateStr === selectedDate ? 1 : 0,
        useNativeDriver: true,
        tension: 140,
        friction: 9,
      })
    );
    Animated.parallel(animations).start();
  }, [selectedDate]);

  // Sync month view when expanded or selectedDate changes
  useEffect(() => {
    if (expanded) {
      const d = new Date(selectedDate + 'T12:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [expanded, selectedDate]);

  const handleDayPress = useCallback(
    (dateStr) => { if (onDatePress) onDatePress(dateStr); },
    [onDatePress]
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthDays = getMonthGrid(viewYear, viewMonth);

  return (
    <LinearGradient
      colors={['#DEB4CC', '#BF789C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.gradient, { paddingTop: insets.top + 14 }]}
    >
      {/* ── TOP ROW ── */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onStreakPress} activeOpacity={0.75} style={styles.pill}>
          <Text style={styles.pillText}>⚡ {streak}</Text>
        </TouchableOpacity>

        <Text style={styles.todayLabel}>
          {expanded
            ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
            : selectedDate === TODAY
              ? 'Hoy'
              : (() => {
                  const d = new Date(selectedDate + 'T12:00:00');
                  return `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
                })()
          }
        </Text>

        <View style={styles.iconsRow}>
          <TouchableOpacity
            onPress={onBellPress}
            activeOpacity={0.7}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Ver notificaciones"
          >
            <Ionicons name="notifications-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGridPress}
            activeOpacity={0.7}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Contraer calendario' : 'Expandir calendario'}
            accessibilityState={{ expanded }}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'calendar-outline'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {expanded ? (
        /* ── MONTH VIEW ── */
        <>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={prevMonth}
              style={styles.monthNavBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mes anterior"
            >
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <Text style={styles.monthNavTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              style={styles.monthNavBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mes siguiente"
            >
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthDayLabelsRow}>
            {DAY_LABELS.map((l, i) => (
              <Text key={i} style={styles.monthDayLabelText}>{l}</Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthDays.map((day, i) => (
              <MonthDayCell
                key={i}
                day={day}
                isSelected={day?.dateStr === selectedDate}
                isMarked={day ? !!markedDates[day.dateStr] : false}
                isCompleted={day ? !!completedDates[day.dateStr] : false}
                isToday={day?.dateStr === TODAY}
                onPress={handleDayPress}
              />

            ))}
          </View>
        </>
      ) : (
        /* ── WEEK VIEW ── */
        <View style={styles.weekRow}>
          {weekDays.map((day, i) => (
            <DayCell
              key={day.dateStr}
              day={day}
              isSelected={day.dateStr === selectedDate}
              isMarked={!!markedDates[day.dateStr]}
              isCompleted={!!completedDates[day.dateStr]}
              isToday={day.dateStr === TODAY}
              onPress={() => handleDayPress(day.dateStr)}
              animValue={animValues[i]}
            />
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 18,
    paddingHorizontal: H_PAD,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },

  // ── top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  todayLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── week view ──
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  dayLabelSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayLabelToday: {
    color: '#fff',
    fontWeight: '700',
  },
  dayCircleWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dayCircleSelected: {
    borderRadius: 17,
    backgroundColor: '#fff',
  },
  dayCircleCompleted: {
    borderRadius: 17,
    backgroundColor: 'rgba(255, 243, 180, 0.38)',
  },
  dayCircleToday: {
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  dayCircleTodayRing: {
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  dayNumber: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: '#BF789C',
    fontWeight: '800',
  },
  dayNumberCompleted: {
    color: '#fff',
    fontWeight: '700',
  },
  dayNumberToday: {
    color: '#fff',
    fontWeight: '800',
  },
  indicatorRow: {
    height: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  markedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 230, 130, 0.95)',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
  },

  // ── month view ──
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  monthDayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  monthDayLabelText: {
    width: CELL_W,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: CELL_W,
    alignItems: 'center',
    marginBottom: 6,
  },
  monthCellInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCellCompleted: {
    backgroundColor: 'rgba(255, 243, 180, 0.42)',
  },
  monthCellMarked: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  monthCellSelected: {
    backgroundColor: '#fff',
  },
  monthCellToday: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  monthCellNum: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '500',
  },
  monthCellNumCompleted: {
    color: '#fff',
    fontWeight: '800',
  },
  monthCellNumMarked: {
    color: '#fff',
    fontWeight: '700',
  },
  monthCellNumSelected: {
    color: '#BF789C',
    fontWeight: '800',
  },
  monthCellNumToday: {
    color: '#fff',
    fontWeight: '800',
  },
  monthMarkedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    position: 'absolute',
    bottom: 2,
  },
  monthCompletedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 230, 130, 0.95)',
    position: 'absolute',
    bottom: 2,
  },
});
