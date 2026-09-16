import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../auth/AuthContext';

export default function AuthButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  const handlePress = () => {
    if (user) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={user ? 'Ver perfil' : 'Iniciar sesión'}
    >
      {user?.photo ? (
        <Image source={{ uri: user.photo }} style={styles.profileImage} />
      ) : (
        <Ionicons name="person-outline" size={22} color="#C48A95" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E4E8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
