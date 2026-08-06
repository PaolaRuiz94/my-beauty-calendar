import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initProducts } from './src/firebase/products';
import { scheduleAllNotifications } from './src/services/notificationService';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CalendarScreen from './src/components/CalendarScreen';
import DetailScreen from './src/components/DetailScreen';
import ExplorarScreen from './src/components/ExplorarScreen';
import ProductsScreen from './src/components/ProductsScreen';
import CommunityScreen from './src/components/CommunityScreen';
import SplashScreen from './src/components/SplashScreen';
import OnboardingDiagnosisScreen from './src/components/OnboardingDiagnosisScreen';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import ProfileScreen from './src/components/ProfileScreen';
import DiagnosisScreen from './src/components/DiagnosisScreen';
import CategoryDetailScreen from './src/components/CategoryDetailScreen';
import CartScreen from './src/components/CartScreen';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/hooks/useTheme';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

      {/* 🔥 AGREGA ESTO */}
      <CalendarStack.Screen
        name="ProductsModal"
        component={ProductsScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

    </CalendarStack.Navigator>
  );
}

const TAB_ICONS = {
  Calendario: ['calendar', 'calendar-outline'],
  Diagnóstico: ['analytics', 'analytics-outline'],
  Explorar: ['compass', 'compass-outline'],
  Comunidad: ['people', 'people-outline'],
  Perfil: ['person', 'person-outline'],
};

function MainTabNavigator({ initialTab = 'Calendario' }) {
  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#BF789C',
        tabBarInactiveTintColor: '#C0A0A8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#F5E8EC',
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Calendario" component={CalendarStackScreen} />
      <Tab.Screen name="Diagnóstico" component={DiagnosisScreen} />
      <Tab.Screen name="Explorar" component={ExplorarScreen} />
      <Tab.Screen name="Comunidad" component={CommunityScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
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
  const { user, isLoading } = useAuth();
  const [hasDiagnosis, setHasDiagnosis] = useState(null);

  useEffect(() => {
    if (!user) { setHasDiagnosis(null); return; }
    AsyncStorage.getItem('@mybeauty-calendar:diagnosisResult')
      .then(val => setHasDiagnosis(!!val))
      .catch(() => setHasDiagnosis(true));
  }, [user]);

  if (isLoading || (user && hasDiagnosis === null)) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {!hasDiagnosis && (
              <RootStack.Screen name="OnboardingDiagnosis" component={OnboardingDiagnosisScreen} />
            )}
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen name="TipDetail" component={DetailScreen} />
            <RootStack.Screen name="CategoryDetail" component={CategoryDetailScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen name="OnboardingDiagnosis" component={OnboardingDiagnosisScreen} />
            <RootStack.Screen name="Auth" component={AuthStackScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // initProducts se omite: usamos datos locales como source of truth
    // Si en futuro configuras Firestore con permisos de escritura, descomenta:
    // initProducts().catch(() => {});
    scheduleAllNotifications().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <CartProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </CartProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
