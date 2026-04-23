import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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
      { id: 1, title: 'Rutina de definición', description: 'Usa productos específicos para rizos que definen sin endurecer. Aplica con método de definición y seca al aire o con difusor.', body: 'Los rizos necesitan un método claro para mostrarse definidos y naturales. Puedes elegir entre tres tipos de definición según tu textura y el resultado deseado. La fitagem ofrece un acabado suave y compacto, trabajando la crema por mechón para maximizar la hidratación sin peso. Con cepillo definidor consigues rizos más estructurados y uniformes, ideal si buscas forma y volumen controlado. El método rizo a rizo va paso a paso, formando cada rizo con los dedos para lograr máxima definición y un look más marcado. En todos los casos, aplica el producto en secciones y evita tocar el cabello mientras seca para mantener la forma.', cta: 'Prueba fitagem para suavidad, cepillo definidor para estructura o rizo a rizo para máxima definición, y trabaja siempre en secciones con el cabello bien hidratado.' },
      { id: 2, title: 'Hidratación profunda', description: 'Realiza mascarillas nutritivas una vez por semana para mantener rizos suaves y elásticos. Busca ingredientes como manteca de karité y aloe vera.', body: 'Los rizos tienden a perder humedad más rápido, por eso una mascarilla profunda puede ser la diferencia entre cabello rebelde y rizos definidos. Ingredientes como manteca de karité, aceite de coco y aloe vera trabajan en conjunto para devolver elasticidad, reducir el frizz y aportar un acabado suave sin pesar.', cta: 'Aplica la mascarilla sobre cabello húmedo, déjala actuar 10-15 minutos y enjuaga con agua tibia para mejores resultados.' },
      { id: 3, title: 'Protección térmica', description: 'Si usas calor, aplica un protector ligero. Esto evita frizz y preserva la forma natural de tus rizos.', body: 'Aunque prefieras secar al aire, hay días en los que el difusor es necesario. En esos casos, la protección térmica actúa como un escudo invisible que reduce el daño y mantiene los rizos suaves. Un producto ligero evita que el cabello pierda su forma y evita el encrespamiento por exceso de temperatura.', cta: 'Rocía el protector en el cabello húmedo y distribúyelo uniformemente antes de usar calor.' },
      { id: 4, title: 'Desenredado suave', description: 'Desenreda tu cabello en húmedo con acondicionador y dedos o peine de dientes anchos para evitar quiebre.', body: 'El desenredado suave es una práctica esencial para rizos sanos. Hacerlo con cuidado evita tirones, reduce la rotura y conserva la forma natural del rizo. Usa sólo los dedos o un peine de dientes anchos mientras aplicas acondicionador para deslizar los nudos sin dañar la fibra.', cta: 'Comienza desde las puntas y avanza hacia la raíz, manteniendo el cabello húmedo y bien acondicionado.' },
      { id: 5, title: 'Refresco de rizos', description: 'Mantén los rizos definidos entre lavados con una bruma hidratante y un poco de crema ligera en las zonas necesitadas.', body: 'No siempre es necesario lavar para devolver vida a los rizos. Un refresco rápido con agua o bruma hidratante y una pequeña cantidad de crema puede reavivar la forma y el brillo. Esto ayuda a que tus rizos sigan luciendo definidos sin perder elasticidad ni volumen.', cta: 'Spray ligero sobre el cabello seco y define las zonas con más frizz con una crema ligera.' },
    ],
  },
  {
    title: 'Para lisas',
    data: [
      { id: 1, title: 'Rutina de brillo', description: 'Elige un shampoo suave y un acondicionador ligero que aporten brillo sin dejar peso. Enjuaga con agua tibia.', body: 'El cabello liso se ve mejor cuando está limpio y ligero. Una rutina enfocada en el brillo equilibra limpieza y nutrición sin engrasar, dejando la fibra suelta y con un acabado sedoso.', cta: 'Usa shampoo suave y acondicionador en medios y puntas, luego enjuaga con agua tibia para cerrar la cutícula.' },
      { id: 2, title: 'Control de frizz', description: 'Usa un serum anti-frizz en medios y puntas para mantener la suavidad y movimiento natural.', body: 'El frizz puede opacar incluso el cabello más liso. Un serum adecuado crea una capa protectora que reduce el encrespamiento y añade una sensación de pulido sin rigidez.', cta: 'Aplica una pequeña cantidad en medios y puntas sobre cabello seco o húmedo para lograr un acabado suave.' },
      { id: 3, title: 'Corte de puntas', description: 'Renueva regularmente las puntas para conservar la caída lisa y evitar que el cabello luzca opaco.', body: 'Las puntas deshidratadas hacen que el cabello pierda su forma y brillo. Un corte periódico mantiene el largo limpio y evita que las fibras dañadas suban por el tallo.', cta: 'Agenda un corte cada 8-12 semanas para mantener las puntas frescas y el cabello con buen movimiento.' },
      { id: 4, title: 'Nutrición ligera', description: 'Apuesta por mascarillas hidratantes livianas que no engrasen la fibra. Ideal para cabello fino y liso.', body: 'No todo tratamiento necesita ser pesado. Los cabellos lisos se benefician de fórmulas ligeras que hidratan sin restar volumen.', cta: 'Elige mascarillas con texturas gel o crema ligera y aplícalas sólo en medios y puntas.' },
      { id: 5, title: 'Protección solar', description: 'Protege tu cabello del sol con sprays leave-in o accesorios. Evita que la fibra se reseque y pierda brillo.', body: 'El sol puede resecar y desvanecer el cabello liso. Un protector solar capilar actúa como una barrera extra que preserva la hidratación y mantiene el color vibrante.', cta: 'Aplica un spray con filtro UV antes de exponerte al sol y renueva cada pocas horas si es necesario.' },
    ],
  },
  {
    title: 'Transición capilar',
    data: [
      { id: 1, title: 'Corte saludable', description: 'Corta progresivamente las puntas tratadas para favorecer el crecimiento sano del cabello natural.', body: 'Durante la transición, cada corte estratégico es una inversión en salud. Reducir las puntas procesadas poco a poco permite que el cabello natural crezca más fuerte y con menos quiebre.', cta: 'Pide al estilista un corte ligero cada 6-8 semanas para eliminar las partes dañadas y apoyar el crecimiento natural.' },
      { id: 2, title: 'Rutina de volumen', description: 'Usa productos ligeros para darle cuerpo sin apelmazar, sobre todo en raíces mixtas durante la transición.', body: 'La transición a menudo combina texturas diferentes, y el volumen puede marcar la diferencia. Productos ligeros que levantan la raíz y definen sin pesar hacen que el cabello se vea más saludable.', cta: 'Aplica espuma o spray de volumen en la raíz y evita productos saturados en las puntas.' },
      { id: 3, title: 'Cuidado por zonas', description: 'Aplica tratamientos diferentes según la sección: hidratación para las puntas y limpieza equilibrada en la raíz.', body: 'Tratar cada sección según sus necesidades es un acto de sabiduría capilar. Las puntas pueden necesitar nutrición extra, mientras que la raíz requiere limpieza suave.', cta: 'Divide tu cabello en secciones y aplica productos específicos en cada zona durante tu rutina.' },
      { id: 4, title: 'Tiempo de adaptación', description: 'La transición requiere paciencia. Protege y fortalece mientras tu cabello natural crece más largo.', body: 'La mejor aliada de la transición es la paciencia. El cabello natural necesita tiempo para crecer fuerte y sano, y el proceso no siempre es lineal.', cta: 'Mantén una rutina constante y confía en el proceso: cada mes se nota el progreso.' },
      { id: 5, title: 'Evita químicos fuertes', description: 'Disminuye el uso de tintes y alisados mientras avanzas en la transición para dar descanso a la fibra.', body: 'Reducir los químicos es uno de los mejores regalos que le puedes dar a tu cabello en transición. Menos procesos agresivos significan menos daño y más elasticidad.', cta: 'Elige estilos naturales y evita tratamientos decolorantes o alisados hasta que tu cabello esté más fuerte.' },
    ],
  },
  {
    title: 'Skincare',
    data: [
      { id: 1, title: 'Rutina calmante', description: 'Usa limpiadores suaves y tox free. Finaliza con protector solar cada mañana para cuidar tu piel.', body: 'Una piel calmada es una piel feliz. Límpiala con productos suaves que respeten su barrera natural, y termina siempre con protección solar para defenderla del daño diario.', cta: 'Lava tu rostro con un limpiador suave y termina con un protector solar ligero cada mañana.' },
      { id: 2, title: 'Hidratación nocturna', description: 'Aplica una crema nutritiva en la noche para ayudar a la regeneración celular mientras duermes.', body: 'La noche es el mejor momento para reparar la piel. Una crema nutritiva ayuda a potenciar la regeneración celular mientras duermes.', cta: 'Elige una crema rica en nutrientes y aplícala después de limpiar y tonificar por la noche.' },
      { id: 3, title: 'Tratamientos puntuales', description: 'Usa productos específicos para manchas o acné, aplicándolos solo en las zonas afectadas.', body: 'Tratar solo lo necesario evita irritar el resto del rostro. Los tratamientos puntuales funcionan mejor cuando se aplican en zonas concretas.', cta: 'Aplica el producto localizado en las áreas afectadas después de la limpieza y antes de la crema hidratante.' },
      { id: 4, title: 'Exfoliación suave', description: 'Exfolia una vez a la semana con productos suaves para mantener la piel luminosa sin irritarla.', body: 'Una exfoliación suave renueva la piel sin dañarla. Elimina las células muertas, mejora la textura y deja el rostro más luminoso.', cta: 'Usa un exfoliante suave una vez por semana, masajeando con movimientos circulares y retirando con agua tibia.' },
      { id: 5, title: 'Rutina personalizada', description: 'Combina hidratación, protección y tratamientos según tu tipo de piel para resultados balanceados.', body: 'No existe una rutina universal; tu piel merece una fórmula personalizada. Identifica si tu piel es seca, mixta o grasa, y elige productos que respondan a esas necesidades.', cta: 'Observa cómo reacciona tu piel y ajusta los pasos según su nivel de hidratación y sensibilidad.' },
    ],
  },
  {
    title: 'Mejores peluquerías',
    data: [
      { id: 1, title: 'Servicio especializado', description: 'Busca salones con experiencia en tu tipo de cabello y en técnicas de corte por textura.', body: 'Un servicio especializado marca la diferencia entre un corte cualquiera y un corte que realmente potencie tu estilo. Busca peluquerías que comprendan tu textura.', cta: 'Investiga salones con buenas reseñas en tu tipo de cabello y pide ejemplos de trabajos similares al tuyo.' },
      { id: 2, title: 'Consulta previa', description: 'Una buena peluquería te orienta sobre tratamientos, cortes y estilo según tu rutina diaria.', body: 'Una consulta previa es tu oportunidad para alinear expectativas. Habla de tu ritmo de vida, tus hábitos de cuidado y lo que quieres lograr.', cta: 'Pide siempre una consulta antes de cortar o tratar tu cabello para encontrar la opción más práctica y bonita.' },
      { id: 3, title: 'Productos profesionales', description: 'Solicita recomendaciones con ingredientes de calidad y fórmulas respetuosas para tu cabello.', body: 'Los productos profesionales suelen tener fórmulas más cuidadas y resultados más duraderos.', cta: 'Pregunta por productos profesionales adecuados para tu cabello y prueba primero las muestras si es posible.' },
      { id: 4, title: 'Mantenimiento', description: 'Agenda tus visitas de corte y cuidado según tu ritmo de crecimiento y nivel de procesamiento.', body: 'El mantenimiento es lo que mantiene el estilo fresco. Planificar tus visitas evita que pierdas forma y permite que el salón mantenga tu melena saludable.', cta: 'Crea un calendario simple de visitas cada 8-12 semanas según tus necesidades.' },
      { id: 5, title: 'Acabado perfecto', description: 'Pide que te enseñen cómo mantener el peinado en casa con tips sencillos y productos clave.', body: 'El acabado perfecto continúa en casa. Un buen salón no solo deja un peinado bonito, sino que te enseña cómo conservarlo.', cta: 'Pregunta al estilista por el paso a paso para recrear el acabado en casa.' },
    ],
  },
  {
    title: 'Colorimetría',
    data: [
      { id: 1, title: 'Elegir tono', description: 'Escoge tonos que armonicen con tu piel y estilo de vida. Los tonos suaves suelen durar más y cuidar mejor la fibra.', body: 'Elegir el tono correcto es una mezcla de estilo y practicidad. Un color armonioso con tu piel realza tu look y reduce la necesidad de retoques constantes.', cta: 'Consulta con un profesional y elige un tono que complemente tu piel y tu ritmo de vida.' },
      { id: 2, title: 'Cuidado del color', description: 'Usa shampoo y acondicionador para cabello teñido que protejan el pigmento y eviten el desvanecimiento.', body: 'El color necesita atención específica. Productos formulados para cabello teñido ayudan a mantener el pigmento vibrante y evitan que el color se vuelva opaco.', cta: 'Usa shampoo y acondicionador para color en cada lavado y evita lavados excesivos.' },
      { id: 3, title: 'Matizado', description: 'Un servicio de matizado mantiene el color vibrante y corrige tonos indeseados sin daño extra.', body: 'El matizado es el aliado perfecto para mantener un color impecable. Corrige tonos no deseados y realza el brillo sin necesidad de una coloración completa.', cta: 'Incluye matizado en tu rutina de color cada varias semanas según lo necesite tu tono.' },
      { id: 4, title: 'Protección UV', description: 'El sol puede alterar el color. Utiliza productos con filtro UV o usa sombreros al aire libre.', body: 'Los rayos UV no solo dañan la piel, también decoloran el cabello. Un protector con filtro solar preserva el tono y evita que el color se vea apagado.', cta: 'Aplica un protector UV capilar antes de salir y usa sombrero en días de sol intenso.' },
      { id: 5, title: 'Intervalos de retoque', description: 'Planifica retoques según el crecimiento y el tipo de color para mantener un acabado natural y cuidado.', body: 'Los retoques bien programados evitan contrastes drásticos y mantienen el color uniforme.', cta: 'Habla con tu colorista para definir un plan de retoque según tu ritmo de crecimiento.' },
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
};

const getSectionImage = (title) => {
  const n = title.toLowerCase();
  if (n.includes('rizadas')) return sectionImages.rizadas;
  if (n.includes('lisas')) return sectionImages.lisas;
  if (n.includes('transición') || n.includes('transicion')) return sectionImages.transicion;
  if (n.includes('skincare')) return sectionImages.skincare;
  if (n.includes('peluquer')) return sectionImages.peluquerias;
  if (n.includes('colorimetría') || n.includes('colorimetria')) return sectionImages.colorimetria;
  return sectionImages.rizadas;
};

const getSectionIcon = (title) => {
  const n = title.toLowerCase();
  if (n.includes('rizadas')) return 'water-outline';
  if (n.includes('lisas')) return 'sunny-outline';
  if (n.includes('transición') || n.includes('transicion')) return 'leaf-outline';
  if (n.includes('skincare')) return 'heart-outline';
  if (n.includes('peluquer')) return 'cut-outline';
  if (n.includes('colorimetría') || n.includes('colorimetria')) return 'color-palette-outline';
  return 'sparkles-outline';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecommendationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#E8A0A0', '#C47898']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 44 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Recomendaciones</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {categories.map((section) => (
          <View key={section.title} style={styles.section}>

            {/* Section title */}
            <View style={styles.sectionTitleRow}>
              <Ionicons name={getSectionIcon(section.title)} size={13} color="#D6A4A4" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {/* Featured image card */}
            <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
              <ImageBackground
                source={getSectionImage(section.title)}
                style={styles.featuredImage}
                imageStyle={styles.featuredImageStyle}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(30,10,20,0.72)']}
                  style={styles.featuredOverlay}
                >
                  <Text style={styles.featuredTag}>Destacado</Text>
                  <Text style={styles.featuredTitle}>{section.title}</Text>
                  <Text style={styles.featuredSub} numberOfLines={2}>
                    Descubre consejos editoriales y rutinas para tu cabello.
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* Tips carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {section.data.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.tipCard}
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
                  <View style={styles.tipNum}>
                    <Text style={styles.tipNumText}>{String(item.id).padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.tipTitle}>{item.title}</Text>
                  <Text style={styles.tipDesc} numberOfLines={3}>{item.description}</Text>
                  <View style={styles.tipFooter}>
                    <Text style={styles.tipReadMore}>Leer más</Text>
                    <Ionicons name="chevron-forward" size={13} color="#D6A4A4" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // scroll
  scrollContent: {
    paddingTop: 26,
    paddingHorizontal: 18,
  },

  // section
  section: {
    marginBottom: 36,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // featured card
  featuredCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 210,
    marginBottom: 16,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  featuredImage: {
    flex: 1,
  },
  featuredImageStyle: {
    borderRadius: 24,
  },
  featuredOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  featuredTag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 5,
    lineHeight: 26,
  },
  featuredSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
  },

  // carousel
  carouselContent: {
    paddingBottom: 6,
    paddingRight: 4,
  },
  tipCard: {
    width: 168,
    minHeight: 195,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
    justifyContent: 'space-between',
  },
  tipNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    lineHeight: 20,
  },
  tipDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    flex: 1,
  },
  tipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 12,
  },
  tipReadMore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
  },
});
