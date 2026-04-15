import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../auth/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Información</Text>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{user?.name || '—'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || '—'}</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
          }}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 28,
      padding: 24,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      marginBottom: 18,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#C48A95',
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 18,
    },
    label: {
      color: colors.secondary,
      fontSize: 14,
      marginTop: 16,
      marginBottom: 6,
      fontWeight: '700',
    },
    value: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    logoutButton: {
      marginTop: 28,
      backgroundColor: colors.primary,
      borderRadius: 24,
      alignItems: 'center',
      paddingVertical: 16,
    },
    logoutText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 16,
    },
  });
