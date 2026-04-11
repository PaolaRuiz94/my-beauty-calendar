import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    color: '#2D1B3C',
    textAlign: 'center',
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
});