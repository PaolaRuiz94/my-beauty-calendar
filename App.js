import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CalendarScreen from './src/components/CalendarScreen';
import DetailScreen from './src/components/DetailScreen';
import ProductsScreen from './src/components/ProductsScreen';
import DiagnosisScreen from './src/components/DiagnosisScreen';
import RecommendationsScreen from './src/components/RecommendationsScreen';
import MessagesScreen from './src/components/MessagesScreen';
import SplashScreen from './src/components/SplashScreen';
import OnboardingDiagnosisScreen from './src/components/OnboardingDiagnosisScreen';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import ProfileScreen from './src/components/ProfileScreen';
import { ThemeProvider } from './src/hooks/useTheme';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/auth/AuthContext';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CalendarStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.primary,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerBackVisible: false,
      }}
    >
      <CalendarStack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <CalendarStack.Screen
        name="DetailScreen"
        component={DetailScreen}
        options={{ headerShown: true }}
      />
    </CalendarStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator initialRouteName="Diagnóstico" screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Calendario" component={CalendarStackScreen} />
      <Tab.Screen name="Productos" component={ProductsScreen} />
      <Tab.Screen name="Diagnóstico" component={DiagnosisScreen} />
      <Tab.Screen name="Recomendaciones" component={RecommendationsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="OnboardingDiagnosis" component={OnboardingDiagnosisScreen} />
        <RootStack.Screen name="TipDetail" component={DetailScreen} />
        <RootStack.Screen name="Main" component={MainTabNavigator} />
        <RootStack.Screen name="Profile" component={ProfileScreen} />
        <RootStack.Screen name="Auth" component={AuthStackScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
