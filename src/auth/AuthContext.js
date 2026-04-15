import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = '@mybeauty-calendar:user';
const AUTH_USERS_KEY = '@mybeauty-calendar:users';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.warn('Error restoring auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const persistUser = async (userData) => {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  };

  const clearUser = async () => {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  };

  const getStoredUsers = async () => {
    const raw = await AsyncStorage.getItem(AUTH_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  };

  const saveStoredUsers = async (users) => {
    await AsyncStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  };

  const login = async (email, password) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('Email y contraseña son obligatorios.');
    }

    const users = await getStoredUsers();
    const match = users.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password
    );

    if (!match) {
      throw new Error('Email o contraseña incorrectos.');
    }

    const currentUser = { name: match.name, email: match.email };
    setUser(currentUser);
    await persistUser(currentUser);
  };

  const register = async (name, email, password) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      throw new Error('Nombre, email y contraseña son obligatorios.');
    }

    const users = await getStoredUsers();

    const existing = users.some(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      throw new Error('Ya existe una cuenta con ese email.');
    }

    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    await saveStoredUsers([...users, newUser]);

    const currentUser = { name: newUser.name, email: newUser.email };
    setUser(currentUser);
    await persistUser(currentUser);
  };

  const logout = async () => {
    setUser(null);
    await clearUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
