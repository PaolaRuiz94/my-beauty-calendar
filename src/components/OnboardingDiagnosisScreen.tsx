import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import YearPicker from './YearPicker';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Main: { screen: string };
  OnboardingDiagnosis: undefined;
};

type Slide =
  | {
      key: string;
      type: 'intro';
      title: string;
      subtitle: string;
    }
  | {
      key: string;
      type: 'text';
      question: string;
      placeholder: string;
    }
  | {
      key: string;
      type: 'numeric';
      question: string;
      placeholder: string;
    }
  | {
      key: string;
      type: 'chips';
      title: string;
      options: string[];
    };

const slides: Slide[] = [
  {
    key: 'intro-1',
    type: 'intro',
    title: 'Hola ✨',
    subtitle: 'Bienvenida a tu experiencia de cuidado capilar',
  },
  {
    key: 'intro-2',
    type: 'intro',
    title: 'Te vamos a conocer 💖',
    subtitle: 'Responde unas preguntas para entender tu cabello',
  },
  {
    key: 'intro-3',
    type: 'intro',
    title: 'Rutina personalizada 🌸',
    subtitle: 'Recibirás recomendaciones hechas para ti',
  },
  {
    key: 'name',
    type: 'text',
    question: '¿Cómo te gustaría que te llamara la app?',
    placeholder: 'Tu nombre',
  },
  {
    key: 'age',
    type: 'numeric',
    question: 'Registra tu año de nacimiento',
    placeholder: '1990',
  },
  {
    key: 'skinGoals',
    type: 'chips',
    title: 'Objetivos skincare 🌸',
    options: ['Mejorar acné', 'Mejorar manchas', 'Rutina según piel', 'Entender mi piel'],
  },
];

type SetList<T> = React.Dispatch<React.SetStateAction<T>>;

function toggleSelection(item: string, list: string[], setList: SetList<string[]>) {
  if (list.includes(item)) {
    setList(list.filter((value) => value !== item));
  } else {
    setList([...list, item]);
  }
}

export default function OnboardingDiagnosisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  const currentYearString = new Date().getFullYear().toString();
  const [age, setAge] = useState(currentYearString);
  const [skinGoals, setSkinGoals] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const topPadding = Platform.OS === 'ios' ? 48 : 24;
  const slideHeight = height - topPadding;
  const innerSlideHeight = slideHeight * 0.82;

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
      await AsyncStorage.setItem(
        'onboardingProfile',
        JSON.stringify({ name: name.trim(), age: age.trim(), skinGoals })
      );
    } catch (error) {
      console.warn('Error saving onboarding profile:', error);
    }

    navigation.navigate('Main', { screen: 'Diagnóstico' });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const renderIntro = (slide: Extract<Slide, { type: 'intro' }>) => (
    <View style={[styles.slideInner, { backgroundColor: colors.card, height: innerSlideHeight }]}>      
      <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{slide.title}</Text>
      <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
    </View>
  );

  const renderTextInput = (slide: Extract<Slide, { type: 'text' | 'numeric' }>) => {
    const isNumeric = slide.type === 'numeric';

    return (
      <View style={[styles.slideInner, { backgroundColor: colors.card, height: innerSlideHeight }]}>      
        {isNumeric && name.trim().length > 0 ? (
          <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>Hola {name.trim()}</Text>
        ) : null}
        <Text style={[styles.inputTitle, { color: colors.textPrimary }]}>{slide.question}</Text>
        {isNumeric ? (
          <YearPicker value={age} onChange={setAge} minYear={1950} maxYear={new Date().getFullYear()} />
        ) : (
          <TextInput
            value={name}
            onChangeText={(value) => setName(value)}
            placeholder={slide.placeholder}
            placeholderTextColor="#B9A7A2"
            keyboardType="default"
            style={[styles.input, { backgroundColor: '#F7F3F1', color: colors.textPrimary }]}
            maxLength={30}
            returnKeyType="done"
          />
        )}
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>Usaremos estos datos para personalizar tu experiencia.</Text>
      </View>
    );
  };

  const renderChips = (slide: Extract<Slide, { type: 'chips' }>) => {
    const selectedList = skinGoals;
    const setSelectedList = setSkinGoals;

    return (
      <View style={[styles.slideInner, { backgroundColor: colors.card, height: innerSlideHeight }]}>      
        <Text style={[styles.chipsTitle, { color: colors.textPrimary }]}>{slide.title}</Text>
        <View style={styles.chipRow}>
          {slide.options.map((option) => {
            const active = selectedList.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? '#D6A4A4' : colors.background,
                    borderColor: active ? '#D6A4A4' : '#E8D8D6',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => toggleSelection(option, selectedList, setSelectedList)}
              >
                <Text style={[styles.chipText, { color: active ? '#3D2834' : colors.textPrimary }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>Selecciona todos los objetivos que quieras.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#FAF8F6' }]}>      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.list}
        style={styles.scrollView}
        decelerationRate="fast"
        bounces={false}
      >
        {slides.map((item) => (
          <View key={item.key} style={[styles.slide, { width, height: slideHeight }]}>            
            {item.type === 'intro' && renderIntro(item)}
            {(item.type === 'text' || item.type === 'numeric') && renderTextInput(item)}
            {item.type === 'chips' && renderChips(item)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                {
                  width: isActive ? 18 : 8,
                  opacity: isActive ? 1 : 0.3,
                },
              ]}
            />
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#D6A4A4' }]}
        onPress={handleNext}
        activeOpacity={0.85}
        disabled={isNextDisabled}
      >
        <Text style={[styles.actionText, { color: isNextDisabled ? '#7F6A6A' : '#FFFFFF' }]}
        >
          {isLastSlide ? 'Empezar' : 'Siguiente'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    justifyContent: 'space-between',
  },
  list: {
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideInner: {
    width: '100%',
    borderRadius: 30,
    padding: 28,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#8F7181',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  input: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8D8D6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 14,
    backgroundColor: '#F7F3F1',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  chipsTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  chipRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    margin: 6,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D6A4A4',
    marginHorizontal: 6,
  },
  actionButton: {
    marginHorizontal: 28,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
  },
});