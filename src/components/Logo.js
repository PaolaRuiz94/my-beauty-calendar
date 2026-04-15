import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function Logo() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

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

const makeStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    markText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    textContainer: {
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 2,
    },
  });
