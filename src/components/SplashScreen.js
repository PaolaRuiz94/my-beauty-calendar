import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

export default function SplashScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>My Beauty Calendar</Text>
      <Text style={styles.tagline}>Hair care ritual ✨</Text>

      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('OnboardingDiagnosis')}
        activeOpacity={0.85}
      >
        <Text style={[styles.ctaButtonText, { color: colors.white }]}>Comenzar</Text>
      </TouchableOpacity>
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
    ctaButton: {
      marginTop: 32,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 28,
    },
    ctaButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
  });