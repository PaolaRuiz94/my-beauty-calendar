import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Decoración de fondo */}
      <View style={styles.decorBlob} pointerEvents="none">
        <LinearGradient
          colors={['#F0D5E8', '#E8C4D8']}
          style={styles.decorGradient}
        />
      </View>
      <View style={styles.decorBlobBottom} pointerEvents="none">
        <LinearGradient
          colors={['#EDD8E4', '#F5E4EE']}
          style={styles.decorGradient}
        />
      </View>

      {/* Contenido central */}
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name="leaf" size={38} color="#BF789C" />
        </View>

        <Text style={styles.appName}>My beauty Calendar</Text>
        <Text style={styles.tagline}>Hair care ritual</Text>

        <View style={styles.dotsRow}>
          <View style={[styles.decorDot, { opacity: 0.4 }]} />
          <View style={styles.decorDot} />
          <View style={[styles.decorDot, { opacity: 0.4 }]} />
        </View>
      </View>

      {/* Botón */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OnboardingDiagnosis')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#DEB4CC', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Comenzar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legalText}>Tu rutina, tu ritmo.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // decoración
  decorBlob: {
    position: 'absolute',
    top: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    opacity: 0.55,
  },
  decorBlobBottom: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    opacity: 0.45,
  },
  decorGradient: {
    flex: 1,
  },

  // centro
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  appName: {
    fontSize: 34,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#2D2D2D',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 13,
    color: '#D6A4A4',
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  decorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6A4A4',
  },

  // botón
  bottom: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  legalText: {
    marginTop: 16,
    fontSize: 12,
    color: '#CCC',
    letterSpacing: 0.5,
  },
});
