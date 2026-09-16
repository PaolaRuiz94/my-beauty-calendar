import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../DiagnosisScreen.styles';

export default function StatChip({ icon, label, value, valueColor }) {
  return (
    <View style={styles.statChip}>
      <View style={styles.statChipIcon}>
        <Ionicons name={icon} size={15} color="#D6A4A4" />
      </View>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={[styles.statChipValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}
