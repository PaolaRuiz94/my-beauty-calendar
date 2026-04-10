import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CalendarScreen from './src/components/CalendarScreen';
import ProductsScreen from './src/components/ProductsScreen';
import DiagnosisScreen from './src/components/DiagnosisScreen';
import RecommendationsScreen from './src/components/RecommendationsScreen';
import MessagesScreen from './src/components/MessagesScreen';
import SplashScreen from './src/components/SplashScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Calendario" component={CalendarScreen} />
        <Tab.Screen name="Productos" component={ProductsScreen} />
        <Tab.Screen name="Diagnóstico" component={DiagnosisScreen} />
        <Tab.Screen name="Recomendaciones" component={RecommendationsScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
