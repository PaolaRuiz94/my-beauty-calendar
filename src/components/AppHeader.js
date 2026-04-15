import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../auth/AuthContext';

export default function AppHeader() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (user) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>      
      <View style={styles.header}>
        <Text style={styles.title}>My Beauty Calendar</Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.75}
          onPress={handlePress}
        >
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-outline" size={22} color="#C48A95" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    minHeight: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C48A95',
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E4E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});