import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RoutineItem from './RoutineItem';
import styles from '../CalendarScreen.styles';

export default function RoutineCard({ title, iconName, accentColor, routines, completed, onToggle, onNavigate, onProductPress, onPlusPress, onMenuPress, isSkipped }) {
  const total     = routines.length;
  const done      = completed.length;
  const isAllDone = total > 0 && done === total;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const colorAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: total > 0 ? done / total : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    Animated.timing(colorAnim, {
      toValue: isAllDone ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [done, total, isAllDone]);

  return (
    <View style={styles.routineCard}>
      <View style={styles.routineCardHeader}>
        <Ionicons name={iconName} size={15} color={accentColor} style={{ marginRight: 6 }} />
        <Text style={[styles.routineCardTitle, { color: accentColor }]}>{title}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Más opciones de la rutina"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#CCC" />
        </TouchableOpacity>
      </View>

      {isSkipped ? (
        <View style={styles.restDayBox}>
          <Text style={styles.restDayEmoji}>🌙</Text>
          <Text style={styles.restDayText}>Día de descanso</Text>
          <Text style={styles.restDaySubtext}>Saltaste esta rutina a propósito.</Text>
        </View>
      ) : (
        <>
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
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
                  backgroundColor: colorAnim.interpolate({ inputRange: [0, 1], outputRange: [accentColor, '#7ADA7A'] }),
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
            <TouchableOpacity
              style={styles.addRowLeft}
              onPress={onPlusPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Agregar paso a la rutina"
            >
              <View style={[styles.plusBtn, { backgroundColor: accentColor + '18', borderColor: accentColor + '44' }]}>
                <Ionicons name="add" size={18} color={accentColor} />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.squareBtn, { borderColor: accentColor + '88' }]}
              onPress={onNavigate}
              accessibilityRole="button"
              accessibilityLabel="Ver productos de la rutina"
            >
              <Ionicons name="bag-handle-outline" size={16} color={accentColor} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
