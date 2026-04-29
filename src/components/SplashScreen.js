import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logo = require('../../assets/logo.png');

export default function SplashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.decorBlob} pointerEvents="none">
        <LinearGradient colors={['#F0D5E8', '#E8C4D8']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.decorBlobBottom} pointerEvents="none">
        <LinearGradient colors={['#EDD8E4', '#F5E4EE']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <View style={styles.dotsRow}>
          <View style={[styles.decorDot, { opacity: 0.4 }]} />
          <View style={styles.decorDot} />
          <View style={[styles.decorDot, { opacity: 0.4 }]} />
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OnboardingDiagnosis')}
          activeOpacity={0.85}
          style={{ width: '100%' }}
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

        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.7}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>Ya tengo cuenta  <Text style={styles.loginLinkBold}>Iniciar sesión</Text></Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 16,
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
  loginLink: {
    marginTop: 18,
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#B89AAA',
    textAlign: 'center',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#BF789C',
  },
});
