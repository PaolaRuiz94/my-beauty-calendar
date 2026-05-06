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

const CONTENT = {
  'Para rizadas': {
    fact: 'El patrón rizado evolucionó en África para proteger el cuero cabelludo del sol intenso — cada espiral actúa como un escudo natural contra el calor.',
    beauty: 'El cabello rizado es una obra de arte viva. Cada rizo es un espiral único, una firma genética que narra siglos de historia, mezcla de culturas y fortaleza heredada. Lejos de ser "difícil de manejar", el cabello rizado es abundante, lleno de personalidad y con una energía que no pasa desapercibida. Cuidarlo es un acto de amor propio.',
    origin: 'El patrón rizado tiene raíces en África, donde la densidad y la forma espiral del cabello protegían el cuero cabelludo del sol intenso. Con la diáspora africana, estas texturas viajaron por el mundo y se mezclaron con otras culturas, dando lugar a los rizos que hoy vemos en América Latina, el Caribe y Europa. Durante siglos el cabello rizado fue suprimido por estándares de belleza eurocéntricos, pero hoy el movimiento natural reivindica su valor cultural y estético.',
    women: [
      { name: 'Lupita Nyong\'o', desc: 'Actriz ganadora del Oscar que convirtió su cabello natural en símbolo de orgullo africano en cada alfombra roja.' },
      { name: 'Solange Knowles', desc: 'Artista y activista que celebra la textura afro como expresión artística y política.' },
      { name: 'Zendaya', desc: 'Icono de su generación que experimenta con su cabello naturalmente rizado sin miedo ni límites.' },
      { name: 'Indira Bermúdez', desc: 'Modelo colombiana que rompió estándares con su melena rizada en las pasarelas internacionales.' },
    ],
  },
  'Para lisas': {
    fact: 'En Japón existe el "7 skin method": aplicar hidratación en 7 capas finas para que el cabello y la piel absorban los nutrientes de forma progresiva y duradera.',
    beauty: 'El cabello liso tiene una elegancia que fluye con el movimiento. Su brillo natural, su suavidad al tacto y la facilidad con la que cae crean un marco perfecto para cualquier estilo. Lejos de ser "simple", el cabello liso tiene una versatilidad infinita: puede ser voluminoso, brillante, estructurado o completamente natural, todo dependiendo de cómo lo cuides y lo uses.',
    origin: 'El cabello liso predomina en Asia oriental, Europa y América, y ha sido históricamente asociado a ideales de belleza en muchas culturas. En Japón, el ritual del cuidado capilar con aceites y técnicas ancestrales elevó el cabello liso a símbolo de salud y feminidad. En Latinoamérica, la diversidad de texturas convive con una larga historia de valoración del "pelo bueno", una narrativa que hoy se transforma hacia la aceptación de todas las texturas.',
    women: [
      { name: 'Yalitza Aparicio', desc: 'Actriz mexicana que redefinió la belleza indígena y latinoamericana en Hollywood.' },
      { name: 'Penélope Cruz', desc: 'Icono español cuyo cabello liso oscuro se convirtió en parte de su identidad internacional.' },
      { name: 'Jennifer López', desc: 'Artista latina que ha llevado su cabello brillante y sano como símbolo de poder y sensualidad.' },
      { name: 'Sofía Vergara', desc: 'Actriz colombiana que convirtió su melena lisa en uno de sus sellos más reconocidos a nivel mundial.' },
    ],
  },
  'Para onduladas': {
    fact: 'El cabello ondulado cambia de forma según la humedad ambiental — en días húmedos las ondas se intensifican porque la fibra capilar absorbe el agua del aire y se curva más.',
    beauty: 'El cabello ondulado vive entre dos mundos y lo hace con una gracia incomparable. Sus ondas naturales aportan movimiento, volumen y una textura que parece recién salida de la playa. Es un cabello que cambia con el clima, con el humor y con la humedad, lo que lo hace impredecible y emocionante. Aprender a trabajar con él —no contra él— es descubrir una de las texturas más versátiles que existen.',
    origin: 'Las ondas son frecuentes en las regiones mediterráneas, el Medio Oriente y Latinoamérica, fruto de mezclas genéticas que atravesaron continentes. En la cultura griega y romana, las ondas naturales eran símbolo de belleza y fertilidad, representadas en esculturas y pinturas. En el Caribe y Sudamérica, el cabello ondulado es parte del mestizaje cultural, una textura que lleva la historia de varias razas en una sola fibra.',
    women: [
      { name: 'Gal Gadot', desc: 'Actriz israelí cuyas ondas naturales acompañan su imagen de fortaleza y elegancia.' },
      { name: 'Sara Carbonero', desc: 'Periodista española que popularizó el estilo "ondas naturales al natural" como tendencia de belleza.' },
      { name: 'Shakira', desc: 'Cantante colombiana cuyas ondas y rizos han sido parte inseparable de su identidad artística.' },
      { name: 'Camila Cabello', desc: 'Artista cubano-americana que abraza su textura ondulada como parte de su autenticidad.' },
    ],
  },
  'Transición capilar': {
    fact: 'Durante la transición capilar conviven dos texturas distintas en el mismo cabello — la raíz natural y la punta procesada. Cortarlas progresivamente (en lugar de todo de golpe) reduce la rotura y facilita el proceso.',
    beauty: 'La transición capilar es uno de los actos de amor propio más poderosos que una mujer puede hacer. Es la decisión de dejar atrás los procesos químicos y redescubrir la textura con la que naciste. No es solo un cambio de cabello, es un cambio de perspectiva: aprender a querer lo que siempre fue tuyo y que tal vez nunca te permitiste ver.',
    origin: 'El movimiento "natural hair" nació con fuerza en Estados Unidos a mediados del siglo XX como respuesta política y cultural al Black Power. En los 2010s resurgió en redes sociales, creando comunidades globales de mujeres que compartían su proceso de transición. En Latinoamérica el movimiento tomó fuerza como rechazo al alisado compulsivo y afirmación de identidades afrodescendientes e indígenas.',
    women: [
      { name: 'Viola Davis', desc: 'Actriz que renunció a la peluca en los Emmy para mostrar su cabello natural y contar su historia.' },
      { name: 'Tracee Ellis Ross', desc: 'Actriz y emprendedora que creó una línea de productos para cabello natural inspirada en su propia transición.' },
      { name: 'Esperanza Spalding', desc: 'Músico que lució su afro sin disculpas en los Grammy, marcando un antes y un después.' },
      { name: 'Amanda Gorman', desc: 'Poeta y activista que usa su cabello natural como extensión de su mensaje de orgullo y resistencia.' },
    ],
  },
  'Skincare': {
    fact: 'Cleopatra se bañaba en leche de burra para mantener su piel suave — el ácido láctico de la leche es uno de los exfoliantes más antiguos del mundo y sigue siendo un ingrediente activo en productos modernos.',
    beauty: 'Tu piel es el órgano más grande de tu cuerpo y el que más expones al mundo cada día. Cuidarla no es vanidad, es salud. Una rutina de skincare consciente y personalizada no solo mejora la apariencia de la piel, sino que crea un momento diario de conexión contigo misma, de presencia y de autocuidado que impacta cómo te sientes por dentro.',
    origin: 'El cuidado de la piel tiene miles de años de historia. En el Antiguo Egipto, Cleopatra se bañaba en leche para suavizar su piel. En China, las recetas de jade y té verde para tratar la piel datan de hace 2.000 años. En Japón, el ritual de 7 capas de hidratación (conocido como "7 skin method") sigue vigente. Hoy la industria del skincare fusiona ciencia moderna con sabiduría ancestral.',
    women: [
      { name: 'Huda Kattan', desc: 'Emprendedora de belleza que democratizó el conocimiento del skincare para millones de mujeres.' },
      { name: 'Hyram Yarbro', desc: 'Referente en educación de skincare que rompió mitos y enseñó a leer ingredientes.' },
      { name: 'Dr. Barbara Sturm', desc: 'Médica estética que popularizó el skincare científico y personalizado a nivel mundial.' },
      { name: 'Rihanna', desc: 'Con Fenty Skin demostró que el cuidado de la piel debe ser inclusivo para todos los tonos.' },
    ],
  },
  'Mejores peluquerías': {
    fact: 'En la antigua Grecia los barberos eran también filósofos y consejeros — la peluquería era el lugar donde se tomaban decisiones políticas y se compartían noticias de la ciudad.',
    beauty: 'Encontrar a tu estilista ideal es como encontrar a tu terapeuta de cabello: alguien que te escucha, entiende tu textura y sabe exactamente cómo potenciarla. Una buena peluquería no solo te corta el cabello, te da confianza. El ritual de la peluquería tiene algo de sagrado: es el lugar donde te transformas y sales siendo un poco más tú.',
    origin: 'Las peluquerías tienen origen en la antigua Grecia, donde los barberos eran también filósofos y consejeros de la comunidad. En África, el peinado ha sido durante siglos un ritual social y espiritual que marcaba estatus, identidad y celebración. En América Latina, la "peluquería de barrio" es parte de la cultura popular, un espacio de encuentro y conversación que va más allá del corte.',
    women: [
      { name: 'Tabatha Coffey', desc: 'Estilista australiana que revolucionó la industria con su visión directa y transformadora.' },
      { name: 'Kim Kimble', desc: 'Estilista de celebridades conocida por trabajar con Beyoncé y defender la versatilidad del cabello afro.' },
      { name: 'Ted Gibson', desc: 'Referente en colorimetría y corte que democratizó el lujo capilar para todo tipo de cabello.' },
      { name: 'Christophe Robin', desc: 'Estilista francés cuya filosofía de cuidado natural inspiró una línea de productos de culto global.' },
    ],
  },
  'Colorimetría': {
    fact: 'El balayage fue inventado en Francia en los años 70 — la palabra significa "barrer" en francés, describiendo la técnica de pintar el color a mano libre sin papel de aluminio para lograr un efecto más natural.',
    beauty: 'El color puede cambiar cómo te ves, pero sobre todo cómo te sientes. Elegir el tono correcto para tu piel, tus ojos y tu personalidad es un arte que cuando se hace bien, parece magia. La colorimetría va más allá de teñirse: es entender la armonía entre tu tono de piel y los colores que usas, tanto en el cabello como en la ropa.',
    origin: 'La teoría del color en cabello comenzó a formalizarse en el siglo XIX con el desarrollo de los primeros tintes sintéticos. En los años 60, Vidal Sassoon democratizó el color capilar como expresión artística. En los 80, la colorimetría estacional (primavera, verano, otoño, invierno) se convirtió en sistema de asesoría de imagen. Hoy, con técnicas como balayage, highlights y degradados, el color es más personalizado que nunca.',
    women: [
      { name: 'Marilyn Monroe', desc: 'Convirtió el rubio platino en símbolo de poder y sensualidad que perdura hasta hoy.' },
      { name: 'Rihanna', desc: 'Ha experimentado con cada color imaginable, demostrando que el cabello es el mejor lienzo de expresión personal.' },
      { name: 'Lady Gaga', desc: 'Artista que usó el color capilar como parte de su lenguaje artístico avant-garde desde el inicio.' },
      { name: 'Billie Eilish', desc: 'Su evolución de colores, del negro al rubio, se convirtió en declaración cultural para su generación.' },
    ],
  },
};

export default function CategoryDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { title, data, image } = route.params;
  const content = CONTENT[title] || { beauty: '', origin: '', women: [] };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Hero ── */}
        <ImageBackground source={image} style={styles.hero}>
          <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(20,8,15,0.85)']} style={styles.heroGradient}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { top: insets.top + 12 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>{title}</Text>
          </LinearGradient>
        </ImageBackground>

        {/* ── Consejos carrusel ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={14} color="#BF789C" />
            <Text style={styles.sectionLabel}>CONSEJOS PARA TI</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {data.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.tipCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('TipDetail', {
                  title: `${title} • ${item.title}`,
                  description: item.description,
                  body: item.body,
                  cta: item.cta,
                  tipKey: item.title,
                })}
              >
                <View style={styles.tipNum}>
                  <Text style={styles.tipNumText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <Text style={styles.tipTitle}>{item.title}</Text>
                <Text style={styles.tipDesc} numberOfLines={3}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* ── ¿Sabías que? ── */}
        {content.fact ? (
          <View style={styles.factCard}>
            <View style={styles.factHeader}>
              <Ionicons name="bulb-outline" size={15} color="#BF789C" />
              <Text style={styles.factLabel}>¿SABÍAS QUE?</Text>
            </View>
            <Text style={styles.factText}>{content.fact}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* ── Belleza ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={14} color="#BF789C" />
            <Text style={styles.sectionLabel}>LA BELLEZA</Text>
          </View>
          <Text style={styles.bodyText}>{content.beauty}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Orígenes ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={14} color="#BF789C" />
            <Text style={styles.sectionLabel}>ORÍGENES</Text>
          </View>
          <Text style={styles.bodyText}>{content.origin}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Mujeres icónicas ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={14} color="#BF789C" />
            <Text style={styles.sectionLabel}>MUJERES ICÓNICAS</Text>
          </View>
          {content.women.map((w, i) => (
            <View key={i} style={styles.womanCard}>
              <View style={styles.womanAvatar}>
                <Text style={styles.womanInitial}>{w.name[0]}</Text>
              </View>
              <View style={styles.womanInfo}>
                <Text style={styles.womanName}>{w.name}</Text>
                <Text style={styles.womanDesc}>{w.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Botón productos ── */}
        <TouchableOpacity
          style={styles.productsBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Explorar')}
        >
          <LinearGradient
            colors={['#DEB4CC', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.productsBtnGradient}
          >
            <Ionicons name="flask-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.productsBtnText}>Ver productos recomendados</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },
  hero: {
    height: 300,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BF789C',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5E8EC',
    marginHorizontal: 20,
  },
  womanCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  womanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5E0EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  womanInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#BF789C',
  },
  womanInfo: {
    flex: 1,
  },
  womanName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  womanDesc: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
  },
  carousel: {
    paddingRight: 20,
    gap: 12,
  },
  tipCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tipNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5E8EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BF789C',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  tipDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  factCard: {
    marginHorizontal: 20,
    marginVertical: 4,
    backgroundColor: '#FDF0F5',
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#BF789C',
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BF789C',
    letterSpacing: 1.2,
  },
  factText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  productsBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  productsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  productsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
