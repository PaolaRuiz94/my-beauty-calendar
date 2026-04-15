import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Animated,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Calendar } from 'react-native-calendars';
import AppHeader from './AppHeader';

const recommendations = [
  {
    id: 1,
    title: 'Mascarilla hidratante',
    subtitle: 'Nutrición profunda',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
  },
  {
    id: 2,
    title: 'Aceite capilar',
    subtitle: 'Brillo sin frizz',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6',
  },
  {
    id: 3,
    title: 'Crema de rizos',
    subtitle: 'Definición natural',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
];

export default function CalendarScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const calendarHeightAnim = useRef(new Animated.Value(0)).current;

  const [product, setProduct] = useState('');
  const [routinesByDate, setRoutinesByDate] = useState({});

  const todayRoutines = routinesByDate[selectedDate] || [];

  useEffect(() => {
    Animated.timing(calendarHeightAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, calendarHeightAnim]);

  const calendarHeight = calendarHeightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 400],
  });

  const toggleCalendarExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getWeekDays = () => {
    const baseDate = new Date(selectedDate);
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      return {
        dateStr,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        dayNumber: date.getDate(),
        isSelected: dateStr === selectedDate,
        hasData: (routinesByDate[dateStr]?.length || 0) > 0,
      };
    });
  };

  const buildMarkedDates = () => {
    const marked = {};

    // Mark all dates with saved routines
    Object.keys(routinesByDate).forEach((date) => {
      if (routinesByDate[date].length > 0) {
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: '#D6A4A4',
              borderRadius: 20,
            },
            text: {
              color: '#fff',
              fontWeight: 'bold',
            },
          },
        };
      }
    });

    // Mark selectedDate with light pink if it doesn't have data
    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        customStyles: {
          container: {
            backgroundColor: '#F3D6DC',
            borderRadius: 20,
          },
          text: {
            color: '#333',
            fontWeight: '600',
          },
        },
      };
    }

    return marked;
  };

  const handleSave = () => {
    if (!product.trim()) return;

    setRoutinesByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), product],
    }));

    setProduct('');
  };

  const getFormattedDate = () => {
    return new Date(selectedDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader />
        {/* CALENDAR HEADER */}
        <View style={styles.calendarHeader}>
          <Text style={styles.subtitle}>
            Hoy es un buen día para cuidar de ti
          </Text>
          <TouchableOpacity
            onPress={toggleCalendarExpand}
            activeOpacity={0.6}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
        </View>

        {/* DATE HEADER */}
        <Text style={styles.dateHeader}>{getFormattedDate()}</Text>

        {/* ANIMATED CALENDAR */}
        {!isExpanded ? (
          // WEEK VIEW (Collapsed)
          <View style={styles.weekViewContainer}>
            <View style={styles.weekRow}>
              {getWeekDays().map((day) => (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[
                    styles.weekDay,
                    day.isSelected && styles.weekDaySelected,
                    day.hasData && styles.weekDayWithData,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDate(day.dateStr)}
                >
                  <Text style={[styles.weekDayName, day.isSelected && styles.weekDayNameSelected]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.weekDayNumber, day.isSelected && styles.weekDayNumberSelected]}>
                    {day.dayNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // MONTH VIEW (Expanded)
          <Animated.View style={[styles.calendarContainer, { height: calendarHeight }]}>
            <Calendar
              markingType="custom"
              markedDates={buildMarkedDates()}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              style={styles.calendar}
            />
          </Animated.View>
        )}

        {/* FORM */}
        <View style={styles.cardForm}>
          <Text style={styles.title}>Rutina del día</Text>

          <TextInput
            placeholder="Ej. Shampoo + mascarilla"
            value={product}
            onChangeText={setProduct}
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Guardar rutina</Text>
          </TouchableOpacity>

          {todayRoutines.map((item, index) => (
            <Text key={index} style={styles.item}>
              • {item}
            </Text>
          ))}
        </View>

        {/* RECOMENDADOS */}
        <Text style={styles.sectionTitle}>Recomendado hoy</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recommendations.map((item) => (
            <View key={item.id} style={styles.card}>
              <ImageBackground
                source={{ uri: item.image }}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 20 }}
              >
                <View style={styles.overlay} />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </ImageBackground>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F6',
  },

  calendar: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 18,
  },

  calendarHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A2A74',
    marginBottom: 12,
  },

  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 164, 164, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D6A4A4',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C48A95',
  },

  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'capitalize',
  },

  calendarContainer: {
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },

  weekViewContainer: {
    paddingVertical: 16,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  weekDay: {
    width: 50,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  weekDaySelected: {
    backgroundColor: '#F3D6DC',
  },

  weekDayWithData: {
    backgroundColor: '#D6A4A4',
  },

  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },

  weekDayNameSelected: {
    color: '#333',
    fontWeight: '700',
  },

  weekDayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  weekDayNumberSelected: {
    color: '#5A2A74',
  },

  cardForm: {
    padding: 20,
    backgroundColor: '#F3EDE7',
    borderRadius: 20,
  },

  title: {
    fontWeight: '700',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  button: {
    backgroundColor: '#D6A4A4',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },

  item: {
    marginTop: 5,
    color: '#333',
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontWeight: '700',
  },

  card: {
    width: 170,
    height: 240,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },

  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  cardTitle: {
    color: '#fff',
    fontWeight: '700',
  },
});