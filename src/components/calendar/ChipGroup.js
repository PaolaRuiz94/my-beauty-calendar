import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../CalendarScreen.styles';

export default function ChipGroup({ options, selected, multi = false, onSelect, color = '#BF789C' }) {
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
