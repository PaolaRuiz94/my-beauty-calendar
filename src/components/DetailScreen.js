import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

export default function DetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { title = 'Detalle', description = 'Selecciona un elemento para ver más detalles.' } = route?.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background || '#FAF8F6',
    },
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: colors.background || '#FAF8F6',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 16,
    },
    backButton: {
      marginBottom: 20,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(90, 42, 116, 0.1)',
      borderRadius: 16,
    },
    backButtonText: {
      color: colors.primary || '#5A2A74',
      fontWeight: '700',
      fontSize: 14,
    },
    header: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.textPrimary || '#1E1E1E',
      marginBottom: 20,
    },
    card: {
      flex: 1,
      backgroundColor: colors.card || '#FFFFFF',
      borderRadius: 28,
      padding: 24,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary || '#1E1E1E',
      marginBottom: 14,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary || '#6B6B6B',
    },
  });
