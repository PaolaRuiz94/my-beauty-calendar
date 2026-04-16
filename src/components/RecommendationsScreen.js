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
        body:
          'Los rizos necesitan amor y movimiento más que rigidez. Una rutina de definición bien pensada permite que cada rizo se forme con suavidad, sin apelmazar ni dejar residuos. Al elegir productos ligeros y específicos para rizos, tu cabello puede respirar, mantener su elasticidad y lucir con un brillo natural que resalta cada curva.',
        cta: 'Aplica el producto con las manos en secciones, scrunch y seca con difusor o al aire para maximizar la definición.',
      },
      {
        id: 2,
        title: 'Hidratación profunda',
        description:
          'Realiza mascarillas nutritivas una vez por semana para mantener rizos suaves y elásticos. Busca ingredientes como manteca de karité y aloe vera.',
        body:
          'Los rizos tienden a perder humedad más rápido, por eso una mascarilla profunda puede ser la diferencia entre cabello rebelde y rizos definidos. Ingredientes como manteca de karité, aceite de coco y aloe vera trabajan en conjunto para devolver elasticidad, reducir el frizz y aportar un acabado suave sin pesar.',
        cta: 'Aplica la mascarilla sobre cabello húmedo, déjala actuar 10-15 minutos y enjuaga con agua tibia para mejores resultados.',
      },
      {
        id: 3,
        title: 'Protección térmica',
        description:
          'Si usas calor, aplica un protector ligero. Esto evita frizz y preserva la forma natural de tus rizos.',
        body:
          'Aunque prefieras secar al aire, hay días en los que el difusor es necesario. En esos casos, la protección térmica actúa como un escudo invisible que reduce el daño y mantiene los rizos suaves. Un producto ligero evita que el cabello pierda su forma y evita el encrespamiento por exceso de temperatura.',
        cta: 'Rocía el protector en el cabello húmedo y distribúyelo uniformemente antes de usar calor.',
      },
      {
        id: 4,
        title: 'Desenredado suave',
        description:
          'Desenreda tu cabello en húmedo con acondicionador y dedos o peine de dientes anchos para evitar quiebre.',
        body:
          'El desenredado suave es una práctica esencial para risos sanos. Hacerlo con cuidado evita tirones, reduce la rotura y conserva la forma natural del rizo. Usa sólo los dedos o un peine de dientes anchos mientras aplicas acondicionador para deslizar los nudos sin dañar la fibra.',
        cta: 'Comienza desde las puntas y avanza hacia la raíz, manteniendo el cabello húmedo y bien acondicionado.',
      },
      {
        id: 5,
        title: 'Refresco de rizos',
        description:
          'Mantén los rizos definidos entre lavados con una bruma hidratante y un poco de crema ligera en las zonas necesitadas.',
        body:
          'No siempre es necesario lavar para devolver vida a los rizos. Un refresco rápido con agua o bruma hidratante y una pequeña cantidad de crema puede reavivar la forma y el brillo. Esto ayuda a que tus rizos sigan luciendo definidos sin perder elasticidad ni volumen.',
        cta: 'Spray ligero sobre el cabello seco y define las zonas con más frizz con una crema ligera.',
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
        body:
          'El cabello liso se ve mejor cuando está limpio y ligero. Una rutina enfocada en el brillo equilibra limpieza y nutrición sin engrasar, dejando la fibra suelta y con un acabado sedoso. Los productos correctos realzan el reflejo de la luz y mantienen el cabello con un movimiento natural.',
        cta: 'Usa shampoo suave y acondicionador en medios y puntas, luego enjuaga con agua tibia para cerrar la cutícula.',
      },
      {
        id: 2,
        title: 'Control de frizz',
        description:
          'Usa un serum anti-frizz en medios y puntas para mantener la suavidad y movimiento natural.',
        body:
          'El frizz puede opacar incluso el cabello más liso. Un serum adecuado crea una capa protectora que reduce el encrespamiento y añade una sensación de pulido sin rigidez. Además, ayuda a que tu cabello se vea más elegante y controlado durante todo el día.',
        cta: 'Aplica una pequeña cantidad en medios y puntas sobre cabello seco o húmedo para lograr un acabado suave.',
      },
      {
        id: 3,
        title: 'Corte de puntas',
        description:
          'Renueva regularmente las puntas para conservar la caída lisa y evitar que el cabello luzca opaco.',
        body:
          'Las puntas deshidratadas hacen que el cabello pierda su forma y brillo. Un corte periódico mantiene el largo limpio y evita que las fibras dañadas suban por el tallo, dejando tu melena lisa con un aspecto más sano y pulido.',
        cta: 'Agenda un corte cada 8-12 semanas para mantener las puntas frescas y el cabello con buen movimiento.',
      },
      {
        id: 4,
        title: 'Nutrición ligera',
        description:
          'Apuesta por mascarillas hidratantes livianas que no engrasen la fibra. Ideal para cabello fino y liso.',
        body:
          'No todo tratamiento necesita ser pesado. Los cabellos lisos se benefician de fórmulas ligeras que hidratan sin restar volumen. Esto mantiene la fibra suave y manejable, sin el efecto apelmazado que puede debilitar el peinado.',
        cta: 'Elige mascarillas con texturas gel o crema ligera y aplícalas sólo en medios y puntas.',
      },
      {
        id: 5,
        title: 'Protección solar',
        description:
          'Protege tu cabello del sol con sprays leave-in o accesorios. Evita que la fibra se reseque y pierda brillo.',
        body:
          'El sol puede resecar y desvanecer el cabello liso, dejándolo opaco y quebradizo. Un protector solar capilar o un pañuelo ligero actúan como una barrera extra que preserva la hidratación y mantiene el color vibrante. Es un pequeño paso que hace una gran diferencia.',
        cta: 'Aplica un spray con filtro UV antes de exponerte al sol y renueva cada pocas horas si es necesario.',
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
        body:
          'Durante la transición, cada corte estratégico es una inversión en salud. Reducir las puntas procesadas poco a poco permite que el cabello natural crezca más fuerte y con menos quiebre. Es un proceso gradual que ayuda a tu melena a renovarse sin perder demasiada longitud.',
        cta: 'Pide al estilista un corte ligero cada 6-8 semanas para eliminar las partes dañadas y apoyar el crecimiento natural.',
      },
      {
        id: 2,
        title: 'Rutina de volumen',
        description:
          'Usa productos ligeros para darle cuerpo sin apelmazar, sobre todo en raíces mixtas durante la transición.',
        body:
          'La transición a menudo combina texturas diferentes, y el volumen puede marcar la diferencia. Productos ligeros que levantan la raíz y definen sin pesar hacen que el cabello se vea más saludable y con movimiento. La clave es un balance entre cuerpo y naturalidad.',
        cta: 'Aplica espuma o spray de volumen en la raíz y evita productos saturados en las puntas.',
      },
      {
        id: 3,
        title: 'Cuidado por zonas',
        description:
          'Aplica tratamientos diferentes según la sección: hidratación para las puntas y limpieza equilibrada en la raíz.',
        body:
          'Tratar cada sección según sus necesidades es un acto de sabiduría capilar. Las puntas pueden necesitar nutrición extra, mientras que la raíz requiere limpieza suave. Esta estrategia evita productos innecesarios y asegura que cada parte reciba justo lo que necesita.',
        cta: 'Divide tu cabello en secciones y aplica productos específicos en cada zona durante tu rutina.',
      },
      {
        id: 4,
        title: 'Tiempo de adaptación',
        description:
          'La transición requiere paciencia. Protege y fortalece mientras tu cabello natural crece más largo.',
        body:
          'La mejor aliada de la transición es la paciencia. El cabello natural necesita tiempo para crecer fuerte y sano, y el proceso no siempre es lineal. Con cuidados consistentes y hábitos suaves, podrás lucir una melena más equilibrada y con menos frizz a medida que avanzas.',
        cta: 'Mantén una rutina constante y confía en el proceso: cada mes se nota el progreso.',
      },
      {
        id: 5,
        title: 'Evita químicos fuertes',
        description:
          'Disminuye el uso de tintes y alisados mientras avanzas en la transición para dar descanso a la fibra.',
        body:
          'Reducir los químicos es uno de los mejores regalos que le puedes dar a tu cabello en transición. Menos procesos agresivos significan menos daño, más elasticidad y una base más sana para tu nuevo crecimiento. Es un paso poderoso hacia un cabello más sano y auténtico.',
        cta: 'Elige estilos naturales y evita tratamientos decolorantes o alisados hasta que tu cabello esté más fuerte.',
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
        body:
          'Una piel calmada es una piel feliz. Límpiala con productos suaves que respeten su barrera natural, y termina siempre con protección solar para defenderla del daño diario. Esto mantiene la piel equilibrada, libre de rojeces y con un brillo saludable.',
        cta: 'Lava tu rostro con un limpiador suave y termina con un protector solar ligero cada mañana.',
      },
      {
        id: 2,
        title: 'Hidratación nocturna',
        description:
          'Aplica una crema nutritiva en la noche para ayudar a la regeneración celular mientras duermes.',
        body:
          'La noche es el mejor momento para reparar la piel. Una crema nutritiva ayuda a potenciar la regeneración celular mientras duermes, dejando la piel con más suavidad y menos tirantez al despertar. Es un gesto simple que trae resultados visibles.',
        cta: 'Elige una crema rica en nutrientes y aplícala después de limpiar y tonificar por la noche.',
      },
      {
        id: 3,
        title: 'Tratamientos puntuales',
        description:
          'Usa productos específicos para manchas o acné, aplicándolos solo en las zonas afectadas.',
        body:
          'Tratar solo lo necesario evita irritar el resto del rostro. Los tratamientos puntuales funcionan mejor cuando se aplican en zonas concretas, permitiendo que la piel sana mantenga su equilibrio. Menos es más cuando se trata de tratar imperfecciones.',
        cta: 'Aplica el producto localizado en las áreas afectadas después de la limpieza y antes de la crema hidratante.',
      },
      {
        id: 4,
        title: 'Exfoliación suave',
        description:
          'Exfolia una vez a la semana con productos suaves para mantener la piel luminosa sin irritarla.',
        body:
          'Una exfoliación suave renueva la piel sin dañarla. Elimina las células muertas, mejora la textura y deja el rostro más luminoso. Hazlo con productos delicados para conservar la barrera cutánea y evitar sensibilidad.',
        cta: 'Usa un exfoliante suave una vez por semana, masajeando con movimientos circulares y retirando con agua tibia.',
      },
      {
        id: 5,
        title: 'Rutina personalizada',
        description:
          'Combina hidratación, protección y tratamientos según tu tipo de piel para resultados balanceados.',
        body:
          'No existe una rutina universal; tu piel merece una fórmula personalizada. Identifica si tu piel es seca, mixta o grasa, y elige productos que respondan a esas necesidades. El balance entre hidratación, protección y tratamientos es la base para una piel saludable.',
        cta: 'Observa cómo reacciona tu piel y ajusta los pasos según su nivel de hidratación y sensibilidad.',
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
        body:
          'Un servicio especializado marca la diferencia entre un corte cualquiera y un corte que realmente potencie tu estilo. Busca peluquerías que comprendan tu textura y te ofrezcan soluciones específicas, ya sea para rizos, liso o cabello en transición.',
        cta: 'Investiga salones con buenas reseñas en tu tipo de cabello y pide ejemplos de trabajos similares al tuyo.',
      },
      {
        id: 2,
        title: 'Consulta previa',
        description:
          'Una buena peluquería te orienta sobre tratamientos, cortes y estilo según tu rutina diaria.',
        body:
          'Una consulta previa es tu oportunidad para alinear expectativas. Habla de tu ritmo de vida, tus hábitos de cuidado y lo que quieres lograr. Así el estilista puede recomendar un corte y un mantenimiento realista para ti.',
        cta: 'Pide siempre una consulta antes de cortar o tratar tu cabello para encontrar la opción más práctica y bonita.',
      },
      {
        id: 3,
        title: 'Productos profesionales',
        description:
          'Solicita recomendaciones con ingredientes de calidad y fórmulas respetuosas para tu cabello.',
        body:
          'Los productos profesionales suelen tener fórmulas más cuidadas y resultados más duraderos. Al pedir recomendaciones, busca opciones que respeten tu tipo de cabello y no sobrecarguen la fibra con ingredientes agresivos.',
        cta: 'Pregunta por productos profesionales adecuados para tu cabello y prueba primero las muestras si es posible.',
      },
      {
        id: 4,
        title: 'Mantenimiento',
        description:
          'Agenda tus visitas de corte y cuidado según tu ritmo de crecimiento y nivel de procesamiento.',
        body:
          'El mantenimiento es lo que mantiene el estilo fresco. Planificar tus visitas según el crecimiento y el estado de tu cabello evita que pierdas forma y permite que el salón mantenga tu melena saludable con menos esfuerzo.',
        cta: 'Crea un calendario simple de visitas cada 8-12 semanas según tus necesidades.',
      },
      {
        id: 5,
        title: 'Acabado perfecto',
        description:
          'Pide que te enseñen cómo mantener el peinado en casa con tips sencillos y productos clave.',
        body:
          'El acabado perfecto continúa en casa. Un buen salón no solo deja un peinado bonito, sino que te enseña cómo conservarlo. Con simples gestos y los productos adecuados puedes prolongar ese resultado profesional por más tiempo.',
        cta: 'Pregunta al estilista por el paso a paso para recrear el acabado en casa.',
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
        body:
          'Elegir el tono correcto es una mezcla de estilo y practicidad. Un color armonioso con tu piel realza tu look y reduce la necesidad de retoques constantes. Los tonos suaves también suelen ser menos agresivos con el cabello y más fáciles de mantener.',
        cta: 'Consulta con un profesional y elige un tono que complemente tu piel y tu ritmo de vida.',
      },
      {
        id: 2,
        title: 'Cuidado del color',
        description:
          'Usa shampoo y acondicionador para cabello teñido que protejan el pigmento y eviten el desvanecimiento.',
        body:
          'El color necesita atención específica. Productos formulados para cabello teñido ayudan a mantener el pigmento vibrante y evitan que el color se vuelva opaco. Con una rutina adecuada, tu color se ve más fresco y saludable por más tiempo.',
        cta: 'Usa shampoo y acondicionador para color en cada lavado y evita lavados excesivos.',
      },
      {
        id: 3,
        title: 'Matizado',
        description:
          'Un servicio de matizado mantiene el color vibrante y corrige tonos indeseados sin daño extra.',
        body:
          'El matizado es el aliado perfecto para mantener un color impecable. Corrige tonos no deseados y realza el brillo sin necesidad de una coloración completa. Es ideal para conservar un acabado profesional entre servicios.',
        cta: 'Incluye matizado en tu rutina de color cada varias semanas según lo necesite tu tono.',
      },
      {
        id: 4,
        title: 'Protección UV',
        description:
          'El sol puede alterar el color. Utiliza productos con filtro UV o usa sombreros al aire libre.',
        body:
          'Los rayos UV no solo dañan la piel, también decoloran el cabello. Un protector con filtro solar actúa como un escudo que preserva el tono y evita que el color se vea apagado por el sol. Es un cuidado esencial para cabellos con color vibrante.',
        cta: 'Aplica un protector UV capilar antes de salir y usa sombrero en días de sol intenso.',
      },
      {
        id: 5,
        title: 'Intervalos de retoque',
        description:
          'Planifica retoques según el crecimiento y el tipo de color para mantener un acabado natural y cuidado.',
        body:
          'Los retoques bien programados evitan contrastes drásticos y mantienen el color uniforme. Entender cuánto crece tu cabello y cómo se comporta tu tono te ayuda a decidir cuándo volver al salón sin sobreprocesar la fibra.',
        cta: 'Habla con tu colorista para definir un plan de retoque según tu ritmo de crecimiento.',
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
                    body: item.body,
                    cta: item.cta,
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
