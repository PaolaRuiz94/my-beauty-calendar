import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.markText}>MBC</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>My Beauty</Text>
        <Text style={styles.subtitle}>Calendar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F7E7D5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1C6A3',
  },
  markText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5E3C',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: '#7A5A3B',
    marginTop: 2,
  },
});
