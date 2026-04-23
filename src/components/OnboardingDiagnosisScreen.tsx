import React, { useRef, useState, useMemo, useEffect } from 'react';
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
  Animated,
  Easing,
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

const { width } = Dimensions.get('window');

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

// helper para convertir Animated.Value en opacity + translateY
function useAnimStyle(anim: Animated.Value, offsetY = 20) {
  return {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) },
    ],
  };
}

export default function OnboardingDiagnosisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState(new Date().getFullYear().toString());
  const [skinGoals, setSkinGoals] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);

  // 3 valores independientes para stagger: icono → título → helper
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  // float para intro icon
  const iconFloat = useRef(new Animated.Value(0)).current;
  const floatLoop = useRef<Animated.CompositeAnimation | null>(null);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  const isNextDisabled = useMemo(() => {
    if (currentSlide.type === 'text') return name.trim().length === 0;
    if (currentSlide.type === 'numeric') return age.trim().length !== 4;
    if (currentSlide.key === 'skinGoals') return skinGoals.length === 0;
    return false;
  }, [currentSlide, name, age, skinGoals]);

  useEffect(() => {
    anim1.setValue(0);
    anim2.setValue(0);
    anim3.setValue(0);
    floatLoop.current?.stop();
    iconFloat.setValue(0);

    const ease = Easing.out(Easing.cubic);

    Animated.stagger(90, [
      Animated.timing(anim1, { toValue: 1, duration: 420, easing: ease, useNativeDriver: true }),
      Animated.timing(anim2, { toValue: 1, duration: 400, easing: ease, useNativeDriver: true }),
      Animated.timing(anim3, { toValue: 1, duration: 380, easing: ease, useNativeDriver: true }),
    ]).start(() => {
      if (currentSlide.type === 'intro') {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(iconFloat, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(iconFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        floatLoop.current = loop;
        loop.start();
      }
    });

    return () => { floatLoop.current?.stop(); };
  }, [currentIndex]);

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
    <View style={styles.cardInner}>
      {/* Icono — aparece primero */}
      <Animated.View style={[styles.introIconWrap, useAnimStyle(anim1, 16), { transform: [
        { translateY: Animated.add(
            anim1.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            iconFloat
          ) },
      ]}]}>
        <LinearGradient
          colors={['#F9E4EF', '#EDD0E2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.introIconGradient}
        >
          <Ionicons name={introIcons[slide.key] || 'sparkles-outline'} size={38} color="#BF789C" />
        </LinearGradient>
      </Animated.View>

      {/* Título — aparece segundo */}
      <Animated.View style={[styles.introTextWrap, useAnimStyle(anim2, 14)]}>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </Animated.View>

      {/* Dots decorativos — aparecen terceros */}
      <Animated.View style={[styles.introDots, useAnimStyle(anim3, 10)]}>
        {[0.3, 1, 0.3].map((op, i) => (
          <View key={i} style={[styles.introDot, { opacity: op }]} />
        ))}
      </Animated.View>
    </View>
  );

  const renderTextInput = (slide: Extract<Slide, { type: 'text' | 'numeric' }>) => {
    const isNumeric = slide.type === 'numeric';
    return (
      <View style={styles.cardInner}>
        {/* Icono */}
        <Animated.View style={[styles.questionIconWrap, useAnimStyle(anim1, 16)]}>
          <Ionicons name={isNumeric ? 'calendar-outline' : 'person-outline'} size={26} color="#BF789C" />
        </Animated.View>

        {/* Pregunta */}
        <Animated.View style={[{ width: '100%' }, useAnimStyle(anim2, 14)]}>
          {isNumeric && name.trim().length > 0 && (
            <Text style={styles.greetingText}>Hola, {name.trim()} 👋</Text>
          )}
          <Text style={styles.questionText}>{slide.question}</Text>

          {isNumeric ? (
            <View style={styles.pickerWrap}>
              <YearPicker value={age} onChange={setAge} minYear={1950} maxYear={new Date().getFullYear()} />
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <Ionicons name="sparkles-outline" size={16} color="#D6A4A4" style={styles.inputIcon} />
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
            </View>
          )}
        </Animated.View>

        {/* Helper text */}
        <Animated.Text style={[styles.helpText, useAnimStyle(anim3, 10)]}>
          Usaremos estos datos para personalizar tu experiencia.
        </Animated.Text>
      </View>
    );
  };

  const renderChips = (slide: Extract<Slide, { type: 'chips' }>) => (
    <View style={styles.cardInner}>
      {/* Icono */}
      <Animated.View style={[styles.questionIconWrap, useAnimStyle(anim1, 16)]}>
        <Ionicons name="sparkles-outline" size={26} color="#BF789C" />
      </Animated.View>

      {/* Título + chips */}
      <Animated.View style={[{ width: '100%', alignItems: 'center' }, useAnimStyle(anim2, 14)]}>
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
                {active && (
                  <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginRight: 5 }} />
                )}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Helper */}
      <Animated.Text style={[styles.helpText, useAnimStyle(anim3, 10)]}>
        Selecciona todos los objetivos que quieras.
      </Animated.Text>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="dark" />

      <View style={styles.decorBlob} pointerEvents="none">
        <LinearGradient colors={['#F0D5E8', '#EDD8E4']} style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.decorBlobBottom} pointerEvents="none">
        <LinearGradient colors={['#EDD8E4', '#F5E4EE']} style={StyleSheet.absoluteFill} />
      </View>

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
            {/* Card blanca estática — solo el contenido anima */}
            <View style={styles.card}>
              {item.type === 'intro' && renderIntro(item)}
              {(item.type === 'text' || item.type === 'numeric') && renderTextInput(item)}
              {item.type === 'chips' && renderChips(item)}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={`dot-${index}`}
              style={[styles.dot, { width: isActive ? 22 : 7, opacity: isActive ? 1 : 0.25 }]}
            />
          );
        })}
      </View>

      <View style={[styles.buttonWrap, { paddingBottom: insets.bottom + 28 }]}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} disabled={isNextDisabled} style={{ width: '100%' }}>
          <LinearGradient
            colors={isNextDisabled ? ['#E2C8D4', '#CCB0C0'] : ['#DEB4CC', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{isLastSlide ? 'Empezar' : 'Siguiente'}</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5F8' },

  decorBlob: {
    position: 'absolute', top: -80, right: -60,
    width: 240, height: 240, borderRadius: 120,
    overflow: 'hidden', opacity: 0.5,
  },
  decorBlobBottom: {
    position: 'absolute', bottom: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    overflow: 'hidden', opacity: 0.4,
  },

  scrollView: { flex: 1 },
  list: { alignItems: 'center' },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // card blanca — completamente estática
  card: {
    width: '100%',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },

  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 36,
  },

  // intro
  introIconWrap: { marginBottom: 28 },
  introIconGradient: {
    width: 88, height: 88, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  introTextWrap: { alignItems: 'center', marginBottom: 28 },
  slideTitle: {
    fontSize: 32, fontWeight: '800', color: '#2D2D2D',
    textAlign: 'center', marginBottom: 10, letterSpacing: 0.2,
  },
  titleUnderline: {
    width: 40, height: 3, borderRadius: 2,
    backgroundColor: '#DEB4CC', marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 15, color: '#AAA', textAlign: 'center',
    lineHeight: 23, fontWeight: '500', paddingHorizontal: 8,
  },
  introDots: { flexDirection: 'row', gap: 6 },
  introDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D6A4A4' },

  // input slides
  questionIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 22,
  },
  greetingText: {
    fontSize: 16, fontWeight: '700', color: '#D6A4A4',
    textAlign: 'center', marginBottom: 8,
  },
  questionText: {
    fontSize: 20, fontWeight: '700', color: '#2D2D2D',
    textAlign: 'center', marginBottom: 24,
    lineHeight: 28, paddingHorizontal: 4,
  },
  inputWrap: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#F0DDE2',
    backgroundColor: '#FDF5F8', paddingHorizontal: 14, marginBottom: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 17, color: '#2D2D2D' },
  pickerWrap: { width: '100%', marginBottom: 14 },
  helpText: {
    fontSize: 13, color: '#CCC', textAlign: 'center',
    marginTop: 12, lineHeight: 19, fontWeight: '500',
  },

  // chips
  chipRow: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 10, marginBottom: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: 99, borderWidth: 1.5,
    borderColor: '#F0DDE2', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#D6A4A4', borderColor: '#D6A4A4' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#AAA' },
  chipTextActive: { color: '#fff' },

  // paginación
  pagination: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6, marginVertical: 14,
  },
  dot: { height: 7, borderRadius: 4, backgroundColor: '#D6A4A4' },

  // botón
  buttonWrap: { paddingHorizontal: 26 },
  button: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 20, paddingVertical: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
