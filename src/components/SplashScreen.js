import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function SplashScreen({ onFinish }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // ⏱ duración (2.5 segundos)

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>My Beauty Calendar</Text>
      <Text style={styles.tagline}>Hair Care Ritual ✨</Text>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      fontSize: 36,
      fontWeight: '300',
      fontStyle: 'italic',
      letterSpacing: 0.6,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    tagline: {
      marginTop: 10,
      fontSize: 14,
      color: colors.textSecondary,
    },
  });