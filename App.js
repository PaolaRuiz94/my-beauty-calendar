import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initProducts } from './src/firebase/products';
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
import ErrorBoundary, { withErrorBoundary } from './src/components/ErrorBoundary';

const SafeCalendarScreen = withErrorBoundary(CalendarScreen, { title: 'No pudimos cargar el calendario' });
const SafeDetailScreen = withErrorBoundary(DetailScreen);
const SafeExplorarScreen = withErrorBoundary(ExplorarScreen, { title: 'No pudimos cargar Explorar' });
const SafeProductsScreen = withErrorBoundary(ProductsScreen, { title: 'No pudimos cargar los productos' });
const SafeCommunityScreen = withErrorBoundary(CommunityScreen, { title: 'No pudimos cargar la comunidad' });
const SafeSplashScreen = withErrorBoundary(SplashScreen);
const SafeOnboardingDiagnosisScreen = withErrorBoundary(OnboardingDiagnosisScreen);
const SafeLoginScreen = withErrorBoundary(LoginScreen);
const SafeRegisterScreen = withErrorBoundary(RegisterScreen);
const SafeProfileScreen = withErrorBoundary(ProfileScreen, { title: 'No pudimos cargar tu perfil' });
const SafeDiagnosisScreen = withErrorBoundary(DiagnosisScreen, { title: 'No pudimos cargar el diagnóstico' });
const SafeCategoryDetailScreen = withErrorBoundary(CategoryDetailScreen);
const SafeCartScreen = withErrorBoundary(CartScreen, { title: 'No pudimos cargar el carrito' });

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
        component={SafeCalendarScreen}
        options={{ headerShown: false }}
      />

      <CalendarStack.Screen
        name="DetailScreen"
        component={SafeDetailScreen}
        options={{ headerShown: true }}
      />

      {/* 🔥 AGREGA ESTO */}
      <CalendarStack.Screen
        name="ProductsModal"
        component={SafeProductsScreen}
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
      <Tab.Screen name="Diagnóstico" component={SafeDiagnosisScreen} />
      <Tab.Screen name="Explorar" component={SafeExplorarScreen} />
      <Tab.Screen name="Comunidad" component={SafeCommunityScreen} />
      <Tab.Screen name="Perfil" component={SafeProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={SafeLoginScreen} />
      <AuthStack.Screen name="Register" component={SafeRegisterScreen} />
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
              <RootStack.Screen name="OnboardingDiagnosis" component={SafeOnboardingDiagnosisScreen} />
            )}
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen name="TipDetail" component={SafeDetailScreen} />
            <RootStack.Screen name="CategoryDetail" component={SafeCategoryDetailScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Cart" component={SafeCartScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Splash" component={SafeSplashScreen} />
            <RootStack.Screen name="OnboardingDiagnosis" component={SafeOnboardingDiagnosisScreen} />
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
    // Las notificaciones se sincronizan desde CalendarScreen (necesitan la rutina real).
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary title="La app tuvo un problema" message="Cierra y vuelve a abrir la app. Si el problema sigue, contáctanos.">
        <ThemeProvider>
          <CartProvider>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </CartProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
