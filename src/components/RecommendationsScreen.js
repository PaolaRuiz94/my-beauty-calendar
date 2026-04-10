import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecommendationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recomendaciones</Text>
      <Text style={styles.text}>Aquí verás consejos personalizados según tu diagnóstico.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5DC' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  text: { fontSize: 16, color: '#333', marginTop: 10 },
});
