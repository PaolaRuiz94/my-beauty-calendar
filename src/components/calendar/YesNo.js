import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../CalendarScreen.styles';

export default function YesNo({ value, onChange, color = '#BF789C' }) {
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
