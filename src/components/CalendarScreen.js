import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [product, setProduct] = useState('');
  const [entries, setEntries] = useState({});

  const addEntry = () => {
    if (!product || !selectedDate) return;

    setEntries((prev) => {
      const currentEntries = prev[selectedDate] || [];

      return {
        ...prev,
        [selectedDate]: [...currentEntries, product],
      };
    });

    setProduct('');
  };

  const getMarkedDates = () => {
    const marked = {};

    Object.keys(entries).forEach((date) => {
      marked[date] = {
        selected: true,
        selectedColor: '#FDE68A',
        selectedTextColor: '#000',
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...(marked[selectedDate] || {}),
        selected: true,
        selectedColor: '#D4AF37',
        selectedTextColor: '#fff',
      };
    }

    return marked;
  };

  // 💡 CONSEJOS TIPO FLO
  const tips = [
    {
      title: 'Rutina de hoy',
      desc: 'Aplica tu mascarilla capilar',
      icon: '💆‍♀️',
      color: '#E9D5FF',
    },
    {
      title: 'Tip anti-frizz',
      desc: 'Usa funda de satín esta noche',
      icon: '✨',
      color: '#FBCFE8',
    },
    {
      title: 'Hidratación',
      desc: 'No olvides tu aceite en puntas',
      icon: '💧',
      color: '#BFDBFE',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Beauty Calendar</Text>

      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
      />

      {/* 💅 CARDS TIPO FLO */}
      <Text style={styles.tipsTitle}>Consejos diarios · hoy</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tips.map((tip, index) => (
          <View
            key={index}
            style={[styles.tipCard, { backgroundColor: tip.color }]}
          >
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipDesc}>{tip.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.subtitle}>
        {selectedDate
          ? `Día seleccionado: ${selectedDate}`
          : 'Selecciona un día'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ej: Shampoo hidratante"
        value={product}
        onChangeText={setProduct}
      />

      <Button title="Agregar producto" onPress={addEntry} />

      <View style={styles.entriesContainer}>
        {(entries[selectedDate] || []).map((item, index) => (
          <Text key={index} style={styles.item}>
            • {item}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5DC',
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.6,
    marginBottom: 10,
    textAlign: 'center',
    color: '#2D1B3C',
  },

  // 💡 TIPS
  tipsTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipCard: {
    width: 180,
    minHeight: 180,
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  tipTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  tipDesc: {
    fontSize: 13,
  },

  subtitle: {
    marginTop: 15,
    fontSize: 16,
  },
  entriesContainer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  item: {
    marginTop: 5,
    fontSize: 16,
  },
});