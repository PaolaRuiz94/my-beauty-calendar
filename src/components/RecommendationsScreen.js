import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';

import rizadasImage from '../../assets/rizadas.png';
import lisasImage from '../../assets/lisas.png';
import transicionImage from '../../assets/transicion.png';
import skincareImage from '../../assets/skincare.png';
import peluqueriasImage from '../../assets/peluquerias.jpg';
import colorimetriaImage from '../../assets/colorimetria.jpg';

const categories = [
  {
    title: 'Para rizadas',
    data: [
      {
        id: 1,
        title: 'Rutina de definición',
        description:
          'Usa productos específicos para rizos que definen sin endurecer. Aplica con método de definición y seca al aire o con difusor.',
      },
      {
        id: 2,
        title: 'Hidratación profunda',
        description:
          'Realiza mascarillas nutritivas una vez por semana para mantener rizos suaves y elásticos. Busca ingredientes como manteca de karité y aloe vera.',
      },
      {
        id: 3,
        title: 'Protección térmica',
        description:
          'Si usas calor, aplica un protector ligero. Esto evita frizz y preserva la forma natural de tus rizos.',
      },
      {
        id: 4,
        title: 'Desenredado suave',
        description:
          'Desenreda tu cabello en húmedo con acondicionador y dedos o peine de dientes anchos para evitar quiebre.',
      },
      {
        id: 5,
        title: 'Refresco de rizos',
        description:
          'Mantén los rizos definidos entre lavados con una bruma hidratante y un poco de crema ligera en las zonas necesitadas.',
      },
    ],
  },
  {
    title: 'Para lisas',
    data: [
      {
        id: 1,
        title: 'Rutina de brillo',
        description:
          'Elige un shampoo suave y un acondicionador ligero que aporten brillo sin dejar peso. Enjuaga con agua tibia.',
      },
      {
        id: 2,
        title: 'Control de frizz',
        description:
          'Usa un serum anti-frizz en medios y puntas para mantener la suavidad y movimiento natural.',
      },
      {
        id: 3,
        title: 'Corte de puntas',
        description:
          'Renueva regularmente las puntas para conservar la caída lisa y evitar que el cabello luzca opaco.',
      },
      {
        id: 4,
        title: 'Nutrición ligera',
        description:
          'Apuesta por mascarillas hidratantes livianas que no engrasen la fibra. Ideal para cabello fino y liso.',
      },
      {
        id: 5,
        title: 'Protección solar',
        description:
          'Protege tu cabello del sol con sprays leave-in o accesorios. Evita que la fibra se reseque y pierda brillo.',
      },
    ],
  },
  {
    title: 'Transición capilar',
    image:
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80',
    data: [
      {
        id: 1,
        title: 'Corte saludable',
        description:
          'Corta progresivamente las puntas tratadas para favorecer el crecimiento sano del cabello natural.',
      },
      {
        id: 2,
        title: 'Rutina de volumen',
        description:
          'Usa productos ligeros para darle cuerpo sin apelmazar, sobre todo en raíces mixtas durante la transición.',
      },
      {
        id: 3,
        title: 'Cuidado por zonas',
        description:
          'Aplica tratamientos diferentes según la sección: hidratación para las puntas y limpieza equilibrada en la raíz.',
      },
      {
        id: 4,
        title: 'Tiempo de adaptación',
        description:
          'La transición requiere paciencia. Protege y fortalece mientras tu cabello natural crece más largo.',
      },
      {
        id: 5,
        title: 'Evita químicos fuertes',
        description:
          'Disminuye el uso de tintes y alisados mientras avanzas en la transición para dar descanso a la fibra.',
      },
    ],
  },
  {
    title: 'Skincare',
    data: [
      {
        id: 1,
        title: 'Rutina calmante',
        description:
          'Usa limpiadores suaves y tox free. Finaliza con protector solar cada mañana para cuidar tu piel.',
      },
      {
        id: 2,
        title: 'Hidratación nocturna',
        description:
          'Aplica una crema nutritiva en la noche para ayudar a la regeneración celular mientras duermes.',
      },
      {
        id: 3,
        title: 'Tratamientos puntuales',
        description:
          'Usa productos específicos para manchas o acné, aplicándolos solo en las zonas afectadas.',
      },
      {
        id: 4,
        title: 'Exfoliación suave',
        description:
          'Exfolia una vez a la semana con productos suaves para mantener la piel luminosa sin irritarla.',
      },
      {
        id: 5,
        title: 'Rutina personalizada',
        description:
          'Combina hidratación, protección y tratamientos según tu tipo de piel para resultados balanceados.',
      },
    ],
  },
  {
    title: 'Mejores peluquerías',
    data: [
      {
        id: 1,
        title: 'Servicio especializado',
        description:
          'Busca salones con experiencia en tu tipo de cabello y en técnicas de corte por textura.',
      },
      {
        id: 2,
        title: 'Consulta previa',
        description:
          'Una buena peluquería te orienta sobre tratamientos, cortes y estilo según tu rutina diaria.',
      },
      {
        id: 3,
        title: 'Productos profesionales',
        description:
          'Solicita recomendaciones con ingredientes de calidad y fórmulas respetuosas para tu cabello.',
      },
      {
        id: 4,
        title: 'Mantenimiento',
        description:
          'Agenda tus visitas de corte y cuidado según tu ritmo de crecimiento y nivel de procesamiento.',
      },
      {
        id: 5,
        title: 'Acabado perfecto',
        description:
          'Pide que te enseñen cómo mantener el peinado en casa con tips sencillos y productos clave.',
      },
    ],
  },
  {
    title: 'Colorimetría',
    data: [
      {
        id: 1,
        title: 'Elegir tono',
        description:
          'Escoge tonos que armonicen con tu piel y estilo de vida. Los tonos suaves suelen durar más y cuidar mejor la fibra.',
      },
      {
        id: 2,
        title: 'Cuidado del color',
        description:
          'Usa shampoo y acondicionador para cabello teñido que protejan el pigmento y eviten el desvanecimiento.',
      },
      {
        id: 3,
        title: 'Matizado',
        description:
          'Un servicio de matizado mantiene el color vibrante y corrige tonos indeseados sin daño extra.',
      },
      {
        id: 4,
        title: 'Protección UV',
        description:
          'El sol puede alterar el color. Utiliza productos con filtro UV o usa sombreros al aire libre.',
      },
      {
        id: 5,
        title: 'Intervalos de retoque',
        description:
          'Planifica retoques según el crecimiento y el tipo de color para mantener un acabado natural y cuidado.',
      },
    ],
  },
];

const sectionImages = {
  rizadas: rizadasImage,
  lisas: lisasImage,
  transicion: transicionImage,
  skincare: skincareImage,
  peluquerias: peluqueriasImage,
  colorimetria: colorimetriaImage,
  default: rizadasImage,
};

const getSectionImage = (title) => {
  const normalized = title.toLowerCase();

  if (normalized.includes('rizadas') || normalized.includes('rizos')) {
    return sectionImages.rizadas;
  }
  if (normalized.includes('lisas') || normalized.includes('lacio') || normalized.includes('lisa')) {
    return sectionImages.lisas;
  }
  if (normalized.includes('transición') || normalized.includes('transicion') || normalized.includes('capilar')) {
    return sectionImages.transicion;
  }
  if (normalized.includes('skincare') || normalized.includes('piel')) {
    return sectionImages.skincare;
  }
  if (normalized.includes('peluquer') || normalized.includes('salón') || normalized.includes('salon')) {
    return sectionImages.peluquerias;
  }
  if (normalized.includes('colorimetría') || normalized.includes('colorimetria') || normalized.includes('color')) {
    return sectionImages.colorimetria;
  }

  return sectionImages.default;
};

const CARD_WIDTH = 170;
const CARD_HEIGHT = 220;
const FEATURED_HEIGHT = 260;
const SCREEN_PADDING = 20;

export default function RecommendationsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />

        {categories.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.featuredWrapper}>
              <View style={[styles.featuredBackground, index % 2 === 0 && styles.featuredBackgroundAlt]} />
              <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
                <ImageBackground
                  source={getSectionImage(section.title)}
                  style={styles.featuredImage}
                  imageStyle={styles.featuredImageStyle}
                >
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredPreTitle}>Destacado</Text>
                    <Text style={styles.featuredTitle}>{section.title}</Text>
                    <Text style={styles.featuredSubtitle} numberOfLines={2}>
                      Descubre consejos editoriales y rutinas premium para tu tipo de cabello.
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </View>

            <View style={styles.splitRow} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {section.data.map((item) => (
                <TouchableOpacity
                key={item.id}
                style={styles.smallCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('TipDetail', {
                    title: `${section.title} • ${item.title}`,
                    description: item.description,
                  })
                }
              >
                <View style={styles.smallCardTag}>
                  <Text style={styles.smallCardTagText}>Consejo {item.id}</Text>
                </View>
                <Text style={styles.smallCardLabel}>{item.title}</Text>
                <Text style={styles.smallCardText} numberOfLines={3}>
                  {item.description}
                </Text>
              </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#FAF8F6',
    },
    container: {
      paddingTop: 0,
      paddingBottom: 40,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 18,
      paddingHorizontal: SCREEN_PADDING,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 18,
      paddingHorizontal: SCREEN_PADDING,
    },
    featuredWrapper: {
      paddingHorizontal: SCREEN_PADDING,
      marginBottom: 16,
    },
    featuredBackground: {
      position: 'absolute',
      top: 10,
      left: 0,
      right: 0,
      height: FEATURED_HEIGHT,
      borderRadius: 40,
      backgroundColor: colors.softWhite,
      transform: [{ scaleX: 1.05 }],
    },
    featuredBackgroundAlt: {
      backgroundColor: colors.surface,
    },
    featuredCard: {
      height: FEATURED_HEIGHT,
      borderRadius: 32,
      overflow: 'hidden',
      backgroundColor: colors.card,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: 5,
    },
    featuredImage: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    featuredImageStyle: {
      borderRadius: 32,
    },
    featuredContent: {
      padding: 24,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    featuredPreTitle: {
      color: colors.white,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    featuredTitle: {
      color: colors.white,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 32,
      marginBottom: 8,
    },
    featuredSubtitle: {
      color: colors.white,
      fontSize: 14,
      lineHeight: 20,
      maxWidth: '80%',
    },
    splitRow: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: SCREEN_PADDING,
      marginBottom: 18,
    },
    carousel: {
      paddingLeft: SCREEN_PADDING,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 50,
      marginBottom: 16,
    },
    smallCard: {
      width: CARD_WIDTH,
      minHeight: CARD_HEIGHT,
      borderRadius: 28,
      padding: 18,
      marginRight: 18,
      backgroundColor: colors.white,
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    smallCardTag: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: colors.accent,
      marginBottom: 14,
    },
    smallCardTagText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 12,
    },
    smallCardLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    smallCardText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });
