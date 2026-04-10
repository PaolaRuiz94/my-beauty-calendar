import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const blocks = [
  {
    id: 'rutina',
    title: 'Rutina Capilar',
    subtitle: 'Crea tu camino de cuidado diario',
    content: [
      'Lava tu cabello cada 2-3 días con shampoo suave.',
      'Aplica mascarilla nutritiva una vez por semana.',
      'Termina con un acondicionador ligero en las puntas.',
    ],
  },
  {
    id: 'hidrata',
    title: 'Hidratación Profunda',
    subtitle: 'Recupera brillo, suavidad y fuerza',
    content: [
      'Usa tratamientos intensivos una vez por semana.',
      'Elige productos con aceites naturales y glicerina.',
      'Evita agua muy caliente al enjuagar.',
    ],
  },
  {
    id: 'protege',
    title: 'Protección Diaria',
    subtitle: 'Cuida tu cabello del sol y del calor',
    content: [
      'Aplica protector térmico antes de secar o planchar.',
      'Usa sombreros o pañuelos en exposiciones largas al sol.',
      'No duermas con el cabello húmedo.',
    ],
  },
];

export default function RecommendationsScreen() {
  const [selectedBlock, setSelectedBlock] = useState(null);

  const handleBack = () => setSelectedBlock(null);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {!selectedBlock ? (
          <>
            <Text style={styles.title}>Recomendaciones</Text>
            <Text style={styles.subtitle}>
              Elige un bloque para ver pasos y consejos capilares.
            </Text>

            {blocks.map((block) => (
              <TouchableOpacity
                key={block.id}
                style={styles.card}
                onPress={() => setSelectedBlock(block)}
              >
                <Text style={styles.cardTitle}>{block.title}</Text>
                <Text style={styles.cardSubtitle}>{block.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.detailContainer}>
            <Text style={styles.title}>{selectedBlock.title}</Text>
            <Text style={styles.subtitle}>{selectedBlock.subtitle}</Text>

            {selectedBlock.content.map((line, index) => (
              <Text key={index} style={styles.detailText}>
                • {line}
              </Text>
            ))}

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  detailContainer: {
    paddingBottom: 40,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
