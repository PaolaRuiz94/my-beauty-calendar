import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import YearPicker from './YearPicker';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Main: { screen: string };
  OnboardingDiagnosis: undefined;
};

type Slide =
  | { key: string; type: 'intro'; title: string; subtitle: string }
  | { key: string; type: 'text'; question: string; placeholder: string }
  | { key: string; type: 'numeric'; question: string; placeholder: string }
  | { key: string; type: 'chips'; title: string; options: string[] };

const slides: Slide[] = [
  { key: 'intro-1', type: 'intro', title: 'Hola ✨', subtitle: 'Bienvenida a tu experiencia de cuidado capilar' },
  { key: 'intro-2', type: 'intro', title: 'Te vamos a conocer 💖', subtitle: 'Responde unas preguntas para entender tu cabello' },
  { key: 'intro-3', type: 'intro', title: 'Rutina personalizada 🌸', subtitle: 'Recibirás recomendaciones hechas para ti' },
  { key: 'name', type: 'text', question: '¿Cómo te gustaría que te llamara la app?', placeholder: 'Tu nombre' },
  { key: 'age', type: 'numeric', question: 'Registra tu año de nacimiento', placeholder: '1990' },
  { key: 'skinGoals', type: 'chips', title: 'Objetivos skincare 🌸', options: ['Mejorar acné', 'Mejorar manchas', 'Rutina según piel', 'Entender mi piel'] },
];

const introIcons: Record<string, string> = {
  'intro-1': 'sparkles-outline',
  'intro-2': 'heart-outline',
  'intro-3': 'leaf-outline',
};

type SetList = React.Dispatch<React.SetStateAction<string[]>>;

function toggleSelection(item: string, list: string[], setList: SetList) {
  if (list.includes(item)) setList(list.filter((v) => v !== item));
  else setList([...list, item]);
}

export default function OnboardingDiagnosisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(new Date().getFullYear().toString());
  const [skinGoals, setSkinGoals] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  const isNextDisabled = useMemo(() => {
    if (currentSlide.type === 'text') return name.trim().length === 0;
    if (currentSlide.type === 'numeric') return age.trim().length !== 4;
    if (currentSlide.key === 'skinGoals') return skinGoals.length === 0;
    return false;
  }, [currentSlide, name, age, skinGoals]);

  const handleNext = async () => {
    if (isNextDisabled) return;
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
      return;
    }
    try {
      await AsyncStorage.setItem('onboardingProfile', JSON.stringify({ name: name.trim(), age: age.trim(), skinGoals }));
    } catch (e) {
      console.warn('Error saving onboarding profile:', e);
    }
    navigation.navigate('Main', { screen: 'Diagnóstico' });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  // ── Slide renderers ──────────────────────────────────────────────────────────

  const renderIntro = (slide: Extract<Slide, { type: 'intro' }>) => (
    <View style={styles.card}>
      <View style={styles.introIconWrap}>
        <Ionicons name={introIcons[slide.key] || 'sparkles-outline'} size={36} color="#BF789C" />
      </View>
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
    </View>
  );

  const renderTextInput = (slide: Extract<Slide, { type: 'text' | 'numeric' }>) => {
    const isNumeric = slide.type === 'numeric';
    return (
      <View style={styles.card}>
        {isNumeric && name.trim().length > 0 && (
          <Text style={styles.greetingText}>Hola, {name.trim()} 👋</Text>
        )}
        <Text style={styles.questionText}>{slide.question}</Text>
        {isNumeric ? (
          <YearPicker value={age} onChange={setAge} minYear={1950} maxYear={new Date().getFullYear()} />
        ) : (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={slide.placeholder}
            placeholderTextColor="#CCC"
            keyboardType="default"
            style={styles.input}
            maxLength={30}
            returnKeyType="done"
          />
        )}
        <Text style={styles.helpText}>Usaremos estos datos para personalizar tu experiencia.</Text>
      </View>
    );
  };

  const renderChips = (slide: Extract<Slide, { type: 'chips' }>) => (
    <View style={styles.card}>
      <Text style={styles.questionText}>{slide.title}</Text>
      <View style={styles.chipRow}>
        {slide.options.map((option) => {
          const active = skinGoals.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => toggleSelection(option, skinGoals, setSkinGoals)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helpText}>Selecciona todos los objetivos que quieras.</Text>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="dark" />

      {/* Decoración de fondo */}
      <View style={styles.decorBlob} pointerEvents="none">
        <LinearGradient colors={['#F0D5E8', '#EDD8E4']} style={StyleSheet.absoluteFill} />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.list}
        style={styles.scrollView}
        decelerationRate="fast"
        bounces={false}
      >
        {slides.map((item) => (
          <View key={item.key} style={[styles.slide, { width }]}>
            {item.type === 'intro' && renderIntro(item)}
            {(item.type === 'text' || item.type === 'numeric') && renderTextInput(item)}
            {item.type === 'chips' && renderChips(item)}
          </View>
        ))}
      </ScrollView>

      {/* Paginación */}
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={`dot-${index}`}
              style={[styles.dot, { width: isActive ? 20 : 7, opacity: isActive ? 1 : 0.3 }]}
            />
          );
        })}
      </View>

      {/* Botón siguiente */}
      <View style={[styles.buttonWrap, { paddingBottom: insets.bottom + 28 }]}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} disabled={isNextDisabled}>
          <LinearGradient
            colors={isNextDisabled ? ['#E2C8D4', '#CCB0C0'] : ['#DEB4CC', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? 'Empezar' : 'Siguiente'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'sparkles-outline' : 'arrow-forward'}
              size={18}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // decoración
  decorBlob: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    opacity: 0.5,
  },

  // scroll
  scrollView: {
    flex: 1,
  },
  list: {
    alignItems: 'center',
  },
 slide: {
  alignItems: 'center',
  paddingHorizontal: 22,
  paddingTop: 20, // 👈 separación arriba
  paddingBottom: 20, // 👈 separación abajo respecto a dots
},

  // card
  card: {
  width: '100%',
  flex: 1, // 👈 esto hace que ocupe el espacio disponible
  backgroundColor: '#fff',
  borderRadius: 28,
  padding: 30,
  alignItems: 'center',
  justifyContent: 'center', // opcional: centra contenido interno
  shadowColor: '#C47898',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
  elevation: 6,
},

  // intro
  introIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },

  // input slides
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D6A4A4',
    textAlign: 'center',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 28,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 17,
    marginBottom: 14,
    backgroundColor: '#FDF5F8',
    color: '#2D2D2D',
  },
  helpText: {
    fontSize: 13,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },

  // chips
  chipRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#D6A4A4',
    borderColor: '#D6A4A4',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  chipTextActive: {
    color: '#fff',
  },

  // paginación
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 16,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D6A4A4',
  },

  // botón
  buttonWrap: {
    paddingHorizontal: 26,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
