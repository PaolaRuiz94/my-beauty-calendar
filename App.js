import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CalendarScreen from './src/components/CalendarScreen';
import ProductsScreen from './src/components/ProductsScreen';
import DiagnosisScreen from './src/components/DiagnosisScreen';
import RecommendationsScreen from './src/components/RecommendationsScreen';
import SplashScreen from './src/components/SplashScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Calendario" component={CalendarScreen} />
        <Tab.Screen name="Productos" component={ProductsScreen} />
        <Tab.Screen name="Diagnóstico" component={DiagnosisScreen} />
        <Tab.Screen name="Recomendaciones" component={RecommendationsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
