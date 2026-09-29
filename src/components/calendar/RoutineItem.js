import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductThumb from './ProductThumb';
import styles from '../CalendarScreen.styles';

export default function RoutineItem({ item, index, isCompleted, onToggle, accentColor, onProductPress }) {
  const raw     = typeof item === 'string' ? item : item.text;
  const category = typeof item === 'object' ? item.category : null;
  const displayLabel = typeof item === 'object' ? item.displayLabel : null;
  const colonIdx = raw.indexOf(':');
  const label = displayLabel || category || (colonIdx !== -1 ? raw.slice(0, colonIdx).trim() : '');
  const name  = colonIdx !== -1 && !category ? raw.slice(colonIdx + 1).trim() : raw;
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
      <ProductThumb index={index} product={product} />
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
      <TouchableOpacity
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Marcar como completado"
        accessibilityState={{ selected: isCompleted }}
      >
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
