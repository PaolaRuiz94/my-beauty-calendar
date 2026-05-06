import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../auth/AuthContext';
import {
  subscribeToPosts, subscribeToComments, toggleLike, addComment, addUserPost,
} from '../firebase/posts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YouTubeCarousel from './YouTubeCarousel';

import rizadasImage from '../../assets/rizadas.png';
import lisasImage from '../../assets/lisas.png';
import onduladasImage from '../../assets/onduladas.png';

import transicionImage from '../../assets/transicion.png';
import skincareImage from '../../assets/skincare.png';
import peluqueriasImage from '../../assets/peluquerias.jpg';
import colorimetriaImage from '../../assets/colorimetria.jpg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_TIPS = [
  'Duerme con una funda de almohada de seda para reducir el frizz y la rotura nocturna.',
  'Aplica los productos siempre de mayor a menor peso: agua, crema, gel, aceite.',
  'El agua fría al final del lavado sella la cutícula y aporta más brillo.',
  'Masajea el cuero cabelludo 5 minutos al día para estimular la circulación y el crecimiento.',
  'Nunca peines el cabello rizado seco — siempre con agua o leave-in aplicado.',
  'El exceso de proteína reseca: alterna tratamientos proteicos con mascarillas hidratantes.',
  'Protege el cabello del sol igual que la piel — el UV daña la cutícula y desvanece el color.',
  'Cortar las puntas cada 8–12 semanas evita que la rotura suba por el cabello.',
  'Lavar con agua tibia y enjuagar con fría: el calor abre la cutícula, el frío la cierra.',
  'Menos es más: demasiados productos al mismo tiempo saturan el cabello y lo apagan.',
];

// ── Data ──────────────────────────────────────────────────────────────────────

const categories = [
  {
    title: 'Para rizadas',
    data: [
      { id: 1, title: 'Rutina de definición', description: 'Usa productos específicos para rizos que definen sin endurecer. Aplica con método de definición y seca al aire o con difusor.', body: 'Los rizos necesitan un método claro para mostrarse definidos y naturales. Puedes elegir entre tres tipos de definición según tu textura y el resultado deseado. La fitagem ofrece un acabado suave y compacto, trabajando la crema por mechón para maximizar la hidratación sin peso. Con cepillo definidor consigues rizos más estructurados y uniformes, ideal si buscas forma y volumen controlado. El método rizo a rizo va paso a paso, formando cada rizo con los dedos para lograr máxima definición y un look más marcado.', cta: 'Prueba fitagem para suavidad, cepillo definidor para estructura o rizo a rizo para máxima definición, y trabaja siempre en secciones con el cabello bien hidratado.' },
      { id: 2, title: 'Hidratación profunda', description: 'Realiza mascarillas nutritivas una vez por semana para mantener rizos suaves y elásticos.', body: 'Los rizos tienden a perder humedad más rápido, por eso una mascarilla profunda puede ser la diferencia entre cabello rebelde y rizos definidos.', cta: 'Aplica la mascarilla sobre cabello húmedo, déjala actuar 10-15 minutos y enjuaga con agua tibia.' },
      { id: 3, title: 'Protección térmica', description: 'Si usas calor, aplica un protector ligero. Esto evita frizz y preserva la forma natural de tus rizos.', body: 'Un producto ligero evita que el cabello pierda su forma y evita el encrespamiento por exceso de temperatura.', cta: 'Rocía el protector en el cabello húmedo y distribúyelo uniformemente antes de usar calor.' },
      { id: 4, title: 'Desenredado suave', description: 'Desenreda tu cabello en húmedo con acondicionador y dedos o peine de dientes anchos para evitar quiebre.', body: 'El desenredado suave es una práctica esencial para rizos sanos. Hacerlo con cuidado evita tirones, reduce la rotura y conserva la forma natural del rizo.', cta: 'Comienza desde las puntas y avanza hacia la raíz, manteniendo el cabello húmedo y bien acondicionado.' },
      { id: 5, title: 'Refresco de rizos', description: 'Mantén los rizos definidos entre lavados con una bruma hidratante y un poco de crema ligera.', body: 'No siempre es necesario lavar para devolver vida a los rizos. Un refresco rápido con agua o bruma hidratante puede reavivar la forma y el brillo.', cta: 'Spray ligero sobre el cabello seco y define las zonas con más frizz con una crema ligera.' },
    ],
  },
  {
    title: 'Para lisas',
    data: [
      { id: 1, title: 'Rutina de brillo', description: 'Elige un shampoo suave y un acondicionador ligero que aporten brillo sin dejar peso.', body: 'Una rutina enfocada en el brillo equilibra limpieza y nutrición sin engrasar, dejando la fibra suelta y con un acabado sedoso.', cta: 'Usa shampoo suave y acondicionador en medios y puntas, luego enjuaga con agua tibia.' },
      { id: 2, title: 'Control de frizz', description: 'Usa un serum anti-frizz en medios y puntas para mantener la suavidad y movimiento natural.', body: 'Un serum adecuado crea una capa protectora que reduce el encrespamiento y añade una sensación de pulido sin rigidez.', cta: 'Aplica una pequeña cantidad en medios y puntas sobre cabello seco o húmedo.' },
      { id: 3, title: 'Corte de puntas', description: 'Renueva regularmente las puntas para conservar la caída lisa y evitar que el cabello luzca opaco.', body: 'Las puntas deshidratadas hacen que el cabello pierda su forma y brillo. Un corte periódico mantiene el largo limpio.', cta: 'Agenda un corte cada 8-12 semanas para mantener las puntas frescas.' },
      { id: 4, title: 'Nutrición ligera', description: 'Mascarillas hidratantes livianas que no engrasen la fibra, ideal para cabello fino y liso.', body: 'Los cabellos lisos se benefician de fórmulas ligeras que hidratan sin restar volumen.', cta: 'Elige mascarillas con texturas gel o crema ligera y aplícalas sólo en medios y puntas.' },
      { id: 5, title: 'Protección solar', description: 'Protege tu cabello del sol con sprays leave-in o accesorios. Evita que la fibra se reseque.', body: 'El sol puede resecar y desvanecer el cabello liso. Un protector solar capilar preserva la hidratación.', cta: 'Aplica un spray con filtro UV antes de exponerte al sol.' },
    ],
  },
  {
    title: 'Para onduladas',
    data: [
      { id: 1, title: 'Define tus ondas', description: 'Usa cremas ligeras y espumas para realzar el movimiento natural sin apelmazar.', body: 'Las ondas se definen mejor con productos de textura media que hidraten sin pesar. El scrunch suave activa la forma natural de la onda.', cta: 'Aplica crema o espuma en cabello húmedo con scrunch suave y deja secar al aire o con difusor.' },
      { id: 2, title: 'Hidratación sin peso', description: 'Elige acondicionadores y leave-ins ligeros que nutran sin dejar el cabello lacio.', body: 'Las ondas necesitan hidratación pero sin saturarse. Un acondicionador ligero y un leave-in en spray son ideales.', cta: 'Aplica leave-in en spray sobre cabello húmedo, enfocándote en medios y puntas.' },
      { id: 3, title: 'Control del frizz', description: 'Un gel o mousse ligero ayuda a definir las ondas y reducir el encrespamiento.', body: 'El frizz en onduladas se controla sellando la cutícula con productos ligeros y evitando tocar el cabello mientras seca.', cta: 'Aplica gel suave o mousse y no toques el cabello mientras seca. Usa difusor a temperatura baja.' },
      { id: 4, title: 'Lavado co-wash', description: 'Alterna el shampoo con co-wash para mantener la hidratación y respetar el patrón de onda.', body: 'El co-wash (lavar con acondicionador) conserva la hidratación natural y reduce el frizz en cabellos ondulados.', cta: 'Usa co-wash 1-2 veces por semana y shampoo suave solo cuando sientas acumulación.' },
      { id: 5, title: 'Seca con difusor', description: 'El difusor potencia las ondas naturales sin alterar su patrón. Úsalo a temperatura baja.', body: 'El secado con difusor fija la forma de la onda sin crear frizz. La temperatura baja protege la fibra.', cta: 'Inclina la cabeza y aplica el difusor en secciones con movimientos suaves hacia arriba.' },
    ],
  },
  {
    title: 'Transición capilar',
    data: [
      { id: 1, title: 'Corte saludable', description: 'Corta progresivamente las puntas tratadas para favorecer el crecimiento sano del cabello natural.', body: 'Cada corte estratégico es una inversión en salud. Reducir las puntas procesadas permite que el cabello natural crezca más fuerte.', cta: 'Pide un corte ligero cada 6-8 semanas para eliminar las partes dañadas.' },
      { id: 2, title: 'Rutina de volumen', description: 'Usa productos ligeros para darle cuerpo sin apelmazar, sobre todo en raíces mixtas.', body: 'La transición a menudo combina texturas diferentes, y el volumen puede marcar la diferencia.', cta: 'Aplica espuma o spray de volumen en la raíz y evita productos saturados en las puntas.' },
      { id: 3, title: 'Cuidado por zonas', description: 'Aplica tratamientos diferentes según la sección: hidratación en puntas y limpieza en raíz.', body: 'Tratar cada sección según sus necesidades es un acto de sabiduría capilar.', cta: 'Divide tu cabello en secciones y aplica productos específicos en cada zona.' },
      { id: 4, title: 'Tiempo de adaptación', description: 'La transición requiere paciencia. Protege y fortalece mientras tu cabello natural crece.', body: 'La mejor aliada de la transición es la paciencia. El cabello natural necesita tiempo para crecer fuerte y sano.', cta: 'Mantén una rutina constante y confía en el proceso.' },
      { id: 5, title: 'Evita químicos fuertes', description: 'Disminuye el uso de tintes y alisados mientras avanzas en la transición.', body: 'Reducir los químicos es uno de los mejores regalos que le puedes dar a tu cabello en transición.', cta: 'Elige estilos naturales y evita tratamientos decolorantes o alisados.' },
    ],
  },
  {
    title: 'Skincare',
    data: [
      { id: 1, title: 'Rutina calmante', description: 'Usa limpiadores suaves y tox free. Finaliza con protector solar cada mañana.', body: 'Límpiala con productos suaves que respeten su barrera natural, y termina siempre con protección solar.', cta: 'Lava tu rostro con un limpiador suave y termina con un protector solar ligero cada mañana.' },
      { id: 2, title: 'Hidratación nocturna', description: 'Aplica una crema nutritiva en la noche para ayudar a la regeneración celular.', body: 'La noche es el mejor momento para reparar la piel. Una crema nutritiva ayuda a potenciar la regeneración celular.', cta: 'Elige una crema rica en nutrientes y aplícala después de limpiar y tonificar por la noche.' },
      { id: 3, title: 'Tratamientos puntuales', description: 'Usa productos específicos para manchas o acné, aplicándolos solo en las zonas afectadas.', body: 'Los tratamientos puntuales funcionan mejor cuando se aplican en zonas concretas.', cta: 'Aplica el producto en las áreas afectadas después de la limpieza y antes de la crema.' },
      { id: 4, title: 'Exfoliación suave', description: 'Exfolia una vez a la semana para mantener la piel luminosa sin irritarla.', body: 'Una exfoliación suave renueva la piel sin dañarla. Elimina las células muertas y mejora la textura.', cta: 'Usa un exfoliante suave una vez por semana con movimientos circulares.' },
      { id: 5, title: 'Rutina personalizada', description: 'Combina hidratación, protección y tratamientos según tu tipo de piel.', body: 'No existe una rutina universal; tu piel merece una fórmula personalizada.', cta: 'Observa cómo reacciona tu piel y ajusta los pasos según su nivel de hidratación.' },
    ],
  },
  {
    title: 'Mejores peluquerías',
    data: [
      { id: 1, title: 'Servicio especializado', description: 'Busca salones con experiencia en tu tipo de cabello y en técnicas de corte por textura.', body: 'Un servicio especializado marca la diferencia entre un corte cualquiera y uno que potencie tu estilo.', cta: 'Investiga salones con buenas reseñas en tu tipo de cabello.' },
      { id: 2, title: 'Consulta previa', description: 'Una buena peluquería te orienta sobre tratamientos, cortes y estilo según tu rutina diaria.', body: 'Una consulta previa es tu oportunidad para alinear expectativas. Habla de tu ritmo de vida y hábitos de cuidado.', cta: 'Pide siempre una consulta antes de cortar o tratar tu cabello.' },
      { id: 3, title: 'Productos profesionales', description: 'Solicita recomendaciones con ingredientes de calidad y fórmulas respetuosas para tu cabello.', body: 'Los productos profesionales suelen tener fórmulas más cuidadas y resultados más duraderos.', cta: 'Pregunta por productos profesionales adecuados y prueba muestras si es posible.' },
      { id: 4, title: 'Mantenimiento', description: 'Agenda tus visitas según tu ritmo de crecimiento y nivel de procesamiento.', body: 'El mantenimiento es lo que mantiene el estilo fresco. Planificar tus visitas evita que pierdas forma.', cta: 'Crea un calendario simple de visitas cada 8-12 semanas.' },
      { id: 5, title: 'Acabado perfecto', description: 'Pide que te enseñen cómo mantener el peinado en casa con tips sencillos.', body: 'El acabado perfecto continúa en casa. Un buen salón te enseña cómo conservarlo.', cta: 'Pregunta al estilista por el paso a paso para recrear el acabado en casa.' },
    ],
  },
  {
    title: 'Colorimetría',
    data: [
      { id: 1, title: 'Elegir tono', description: 'Escoge tonos que armonicen con tu piel y estilo de vida.', body: 'Elegir el tono correcto es una mezcla de estilo y practicidad. Un color armonioso con tu piel realza tu look.', cta: 'Consulta con un profesional y elige un tono que complemente tu piel y tu ritmo de vida.' },
      { id: 2, title: 'Cuidado del color', description: 'Usa shampoo y acondicionador para cabello teñido que protejan el pigmento.', body: 'El color necesita atención específica. Productos formulados para cabello teñido ayudan a mantener el pigmento vibrante.', cta: 'Usa shampoo y acondicionador para color en cada lavado y evita lavados excesivos.' },
      { id: 3, title: 'Matizado', description: 'Un servicio de matizado mantiene el color vibrante y corrige tonos indeseados.', body: 'El matizado es el aliado perfecto para mantener un color impecable. Corrige tonos no deseados sin una coloración completa.', cta: 'Incluye matizado en tu rutina de color cada varias semanas según lo necesite tu tono.' },
      { id: 4, title: 'Protección UV', description: 'El sol puede alterar el color. Utiliza productos con filtro UV o usa sombreros al aire libre.', body: 'Los rayos UV no solo dañan la piel, también decoloran el cabello. Un protector con filtro solar preserva el tono.', cta: 'Aplica un protector UV capilar antes de salir y usa sombrero en días de sol intenso.' },
      { id: 5, title: 'Intervalos de retoque', description: 'Planifica retoques según el crecimiento y el tipo de color para un acabado natural.', body: 'Los retoques bien programados evitan contrastes drásticos y mantienen el color uniforme.', cta: 'Habla con tu colorista para definir un plan de retoque según tu ritmo de crecimiento.' },
    ],
  },
];

const sectionMeta = {
  'Para rizadas':       { image: rizadasImage,    icon: 'water-outline' },
  'Para lisas':         { image: lisasImage,       icon: 'sunny-outline' },
  'Para onduladas':     { image: onduladasImage,    icon: 'partly-sunny-outline' },
  'Transición capilar': { image: transicionImage,  icon: 'leaf-outline' },
  'Skincare':           { image: skincareImage,    icon: 'heart-outline' },
  'Mejores peluquerías':{ image: peluqueriasImage, icon: 'cut-outline' },
  'Colorimetría':       { image: colorimetriaImage,icon: 'color-palette-outline' },
};

const getSectionMeta = (title) =>
  sectionMeta[title] || { image: rizadasImage, icon: 'sparkles-outline' };

// ── PostCard (Foro) ───────────────────────────────────────────────────────────

function validLikes(arr) {
  return Array.isArray(arr) ? arr.filter((l) => typeof l === 'string' && l.includes('@')) : [];
}

function PostCard({ post, userEmail, onPress, onLike }) {
  const likes = validLikes(post.likesUsuarios);
  const liked = likes.includes(userEmail);
  const likesCount = likes.length;

  return (
    <TouchableOpacity style={styles.forumCard} onPress={onPress} activeOpacity={0.93}>
      <ImageBackground
        source={{ uri: post.uri || post.imagen }}
        style={styles.forumCardImage}
        imageStyle={styles.forumCardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(20,10,15,0.82)']}
          style={styles.forumCardGradient}
        >
          {(post.Categoría || post.categoria) ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{post.Categoría || post.categoria}</Text>
            </View>
          ) : null}

          <Text style={styles.forumCardTitle}>{post.texto}</Text>

          <View style={styles.forumCardActions}>
            <TouchableOpacity style={styles.forumCardAction} onPress={onLike} activeOpacity={0.7}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#FF6B8A' : 'rgba(255,255,255,0.85)'}
              />
              <Text style={styles.forumCardActionText}>{likesCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forumCardAction} onPress={onPress} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={18} color="rgba(255,255,255,0.85)" />
              <Text style={styles.forumCardActionText}>{post.commentsCount ?? 0}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ── CommentItem ───────────────────────────────────────────────────────────────

function CommentItem({ comment }) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{comment.inicial}</Text>
      </View>
      <View style={styles.commentBubble}>
        <Text style={styles.commentAuthorForo}>{comment.autor}</Text>
        <Text style={styles.commentTextForo}>{comment.texto}</Text>
      </View>
    </View>
  );
}

// ── QuestionCard ──────────────────────────────────────────────────────────────

function QuestionCard({ post, userEmail, onPress, onLike }) {
  const likes = validLikes(post.likesUsuarios);
  const liked = likes.includes(userEmail);
  return (
    <TouchableOpacity style={styles.questionCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.questionHeader}>
        <View style={styles.questionAvatar}>
          <Text style={styles.questionAvatarText}>{post.inicial ?? '?'}</Text>
        </View>
        <Text style={styles.questionAuthor}>{post.autor}</Text>
      </View>
      <Text style={styles.questionText}>{post.texto}</Text>
      <View style={styles.questionFooter}>
        <TouchableOpacity style={styles.questionAction} onPress={onLike} activeOpacity={0.7}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#FF6B8A' : '#CCC'} />
          <Text style={[styles.questionActionText, liked && { color: '#FF6B8A' }]}>{likes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.questionAction} onPress={onPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={15} color="#CCC" />
          <Text style={styles.questionActionText}>{post.commentsCount ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── CommunityScreen ───────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tips');
  const [hairTexture, setHairTexture] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@mybeauty-calendar:hairProfile')
      .then(raw => {
        if (!raw) return;
        const profile = JSON.parse(raw);
        if (profile.isCurly) setHairTexture('Para rizadas');
        else if (profile.isWavy) setHairTexture('Para onduladas');
        else setHairTexture('Para lisas');
      })
      .catch(() => {});
  }, []);

  const TEXTURE_TITLES = ['Para rizadas', 'Para lisas', 'Para onduladas'];

  const sortedCategories = useMemo(() => {
    const nonTexture = categories.filter(c => !TEXTURE_TITLES.includes(c.title));
    if (!hairTexture) return categories;
    const textureCategory = categories.find(c => c.title === hairTexture);
    return textureCategory ? [textureCategory, ...nonTexture] : nonTexture;
  }, [hairTexture]);

  // ── Foro state (Firestore) ──────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToPosts((data) => {
      setPosts(data);
      setPostsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedPost) { setComments([]); return; }
    const unsub = subscribeToComments(selectedPost.id, setComments);
    return unsub;
  }, [selectedPost?.id]);

  useEffect(() => {
    if (!selectedPost) return;
    const updated = posts.find((p) => p.id === selectedPost.id);
    if (updated) setSelectedPost(updated);
  }, [posts]);

  const handleLike = async (post) => {
    if (!user) return;
    const liked = post.likesUsuarios?.includes(user.email);
    await toggleLike(post.id, user.email, liked);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user || !selectedPost || sending) return;
    setSending(true);
    await addComment(selectedPost.id, commentText, user.name);
    setCommentText('');
    setSending(false);
  };

  const closeDetail = () => {
    setSelectedPost(null);
    setComments([]);
    setCommentText('');
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !user || publishing) return;
    setPublishing(true);
    await addUserPost(newPostText, user.name);
    setNewPostText('');
    setPublishing(false);
    setCreateVisible(false);
  };

  // ── Tips search ─────────────────────────────────────────────────────────────

  const [tipsSearch, setTipsSearch] = useState('');

  const tipsSearchResults = (() => {
    const q = tipsSearch.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    categories.forEach((section) => {
      section.data.forEach((item) => {
        if (
          section.title.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        ) {
          results.push({ ...item, sectionTitle: section.title });
        }
      });
    });
    return results;
  })();

  const isSearching = tipsSearch.trim().length > 0;

  // ── Render Consejos ─────────────────────────────────────────────────────────

  const renderTips = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tipsScroll, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search bar */}
      <View style={styles.tipsSearchWrap}>
        <Ionicons name="search-outline" size={16} color="#D6A4A4" />
        <TextInput
          value={tipsSearch}
          onChangeText={setTipsSearch}
          placeholder="Buscar consejos..."
          placeholderTextColor="#CCC"
          style={styles.tipsSearchInput}
          returnKeyType="search"
        />
        {isSearching && (
          <TouchableOpacity onPress={() => setTipsSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={17} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {isSearching ? (
        tipsSearchResults.length === 0 ? (
          <View style={styles.tipsEmptyWrap}>
            <Ionicons name="search-outline" size={36} color="#E8D0D8" />
            <Text style={styles.tipsEmptyText}>Sin resultados para "{tipsSearch}"</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles-outline" size={13} color="#D6A4A4" />
              <Text style={styles.sectionLabel}>{tipsSearchResults.length} resultado{tipsSearchResults.length !== 1 ? 's' : ''}</Text>
            </View>
            {tipsSearchResults.map((item, idx) => {
              const { icon } = getSectionMeta(item.sectionTitle);
              return (
                <TouchableOpacity
                  key={`${item.sectionTitle}-${item.id}-${idx}`}
                  style={styles.searchResultCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('TipDetail', {
                      title: `${item.sectionTitle} • ${item.title}`,
                      description: item.description,
                      body: item.body,
                      cta: item.cta,
                      tipKey: item.title,
                    })
                  }
                >
                  <View style={styles.searchResultLeft}>
                    <View style={styles.searchResultIconWrap}>
                      <Ionicons name={icon} size={15} color="#BF789C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultCategory}>{item.sectionTitle}</Text>
                      <Text style={styles.searchResultTitle}>{item.title}</Text>
                      <Text style={styles.searchResultDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D6A4A4" />
                </TouchableOpacity>
              );
            })}
          </>
        )
      ) : (
        sortedCategories.map((section, sectionIndex) => {
          const { image, icon } = getSectionMeta(section.title);
          const isPersonalized = sectionIndex === 0 && hairTexture === section.title;
          return (
            <View key={section.title}>
            {sectionIndex === 1 && (
              <YouTubeCarousel query="rutina capilar cuidado cabello consejos" title="Videos recomendados" />
            )}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name={icon} size={13} color="#D6A4A4" />
                <Text style={styles.sectionLabel}>{section.title}</Text>
                {isPersonalized && (
                  <View style={styles.paraTimBadge}>
                    <Text style={styles.paraTimBadgeText}>Para ti ✨</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CategoryDetail', { title: section.title, data: section.data, image })}
              >
                <ImageBackground source={image} style={styles.featuredImage} imageStyle={styles.featuredImageRadius}>
                  <LinearGradient
                    colors={['transparent', 'rgba(30,10,20,0.72)']}
                    style={styles.featuredOverlay}
                  >
                    <Text style={styles.featuredTag}>{isPersonalized ? 'Recomendado para ti' : 'Destacado'}</Text>
                    <Text style={styles.featuredTitle}>{section.title}</Text>
                    <View style={styles.featuredBottomRow}>
                      <Text style={styles.featuredSub} numberOfLines={1}>
                        Descubre consejos y rutinas para tu cabello.
                      </Text>
                      <View style={styles.consejosBadge}>
                        <Text style={styles.consejosBadgeText}>{section.data.length} consejos</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>

              {/* ── Tip rápido ── */}
              {sectionIndex < sortedCategories.length - 1 && (
                <LinearGradient
                  colors={['#F5DCEC', '#EDD0E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickTipCard}
                >
                  <Text style={styles.quickTipLabel}>✦  TIP RÁPIDO</Text>
                  <Text style={styles.quickTipText}>
                    {QUICK_TIPS[(sectionIndex) % QUICK_TIPS.length]}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>
          );
        })
      )}
    </ScrollView>
  );

  // ── Render Foro ─────────────────────────────────────────────────────────────

  const renderForo = () => {
    if (postsLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D6A4A4" />
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.forumList, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="flower-outline" size={48} color="#E8C4D8" />
              <Text style={styles.forumEmptyText}>Sé la primera en publicar</Text>
            </View>
          }
          renderItem={({ item }) =>
            item.tipo === 'pregunta' ? (
              <QuestionCard
                post={item}
                userEmail={user?.email}
                onPress={() => setSelectedPost(item)}
                onLike={() => handleLike(item)}
              />
            ) : (
              <PostCard
                post={item}
                userEmail={user?.email}
                onPress={() => setSelectedPost(item)}
                onLike={() => handleLike(item)}
              />
            )
          }
        />
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => setCreateVisible(true)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
            <Ionicons name="add" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Screen ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Comunidad</Text>
          <Text style={styles.headerSub}>Consejos y conversaciones para tu rutina</Text>
        </View>
      </LinearGradient>

      <View style={styles.mainToggle}>
        <TouchableOpacity
          style={[styles.mainToggleBtn, activeTab === 'tips' && styles.mainToggleBtnActive]}
          onPress={() => setActiveTab('tips')}
          activeOpacity={0.85}
        >
          <Ionicons
            name={activeTab === 'tips' ? 'sparkles' : 'sparkles-outline'}
            size={14}
            color={activeTab === 'tips' ? '#BF789C' : '#C0A0A8'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.mainToggleText, activeTab === 'tips' && styles.mainToggleTextActive]}>
            Consejos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainToggleBtn, activeTab === 'foro' && styles.mainToggleBtnActive]}
          onPress={() => setActiveTab('foro')}
          activeOpacity={0.85}
        >
          <Ionicons
            name={activeTab === 'foro' ? 'people' : 'people-outline'}
            size={14}
            color={activeTab === 'foro' ? '#BF789C' : '#C0A0A8'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.mainToggleText, activeTab === 'foro' && styles.mainToggleTextActive]}>
            Foro
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tips' && renderTips()}
      {activeTab === 'foro' && renderForo()}

      {/* Modal crear publicación */}
      <Modal visible={createVisible} animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FDF5F8' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.createHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setCreateVisible(false)} activeOpacity={0.7}>
              <Ionicons name="chevron-down" size={24} color="#BF789C" />
            </TouchableOpacity>
            <Text style={styles.createHeaderTitle}>Nueva publicación</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={!newPostText.trim() || publishing}
              activeOpacity={0.8}
            >
              {publishing
                ? <ActivityIndicator size="small" color="#BF789C" />
                : <Text style={[styles.createPublishBtn, (!newPostText.trim()) && { opacity: 0.35 }]}>Publicar</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.createBody}>
            <View style={styles.createAvatar}>
              <Text style={styles.createAvatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
            </View>
            <TextInput
              style={styles.createInput}
              placeholder="¿Qué quieres preguntarle a la comunidad?"
              placeholderTextColor="#CCC"
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              autoFocus
              maxLength={500}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal detalle del post */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.detailScreen}>
          <StatusBar style="light" translucent backgroundColor="transparent" />

          {selectedPost && (selectedPost.uri || selectedPost.imagen) ? (
            <ImageBackground
              source={{ uri: selectedPost.uri || selectedPost.imagen }}
              style={styles.detailImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'rgba(20,10,15,0.85)']}
                style={styles.detailGradient}
              >
                <TouchableOpacity
                  style={[styles.backBtn, { top: insets.top + 12 }]}
                  onPress={closeDetail}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-down" size={22} color="#fff" />
                </TouchableOpacity>

                <View style={styles.detailBottom}>
                  <Text style={styles.detailTitle}>{selectedPost.texto}</Text>
                  <TouchableOpacity
                    style={styles.detailLikeBtn}
                    onPress={() => handleLike(selectedPost)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={validLikes(selectedPost.likesUsuarios).includes(user?.email) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={validLikes(selectedPost.likesUsuarios).includes(user?.email) ? '#FF6B8A' : '#fff'}
                    />
                    <Text style={styles.detailLikeBtnText}>
                      {validLikes(selectedPost.likesUsuarios).length}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          ) : selectedPost ? (
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              style={[styles.detailQuestionHeader, { paddingTop: insets.top + 12 }]}
            >
              <TouchableOpacity style={styles.detailQuestionBack} onPress={closeDetail} activeOpacity={0.8}>
                <Ionicons name="chevron-down" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.detailQuestionContent}>
                <Text style={styles.detailQuestionAuthor}>{selectedPost.autor}</Text>
                <Text style={styles.detailQuestionText}>{selectedPost.texto}</Text>
                <TouchableOpacity
                  style={styles.detailLikeBtn}
                  onPress={() => handleLike(selectedPost)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={validLikes(selectedPost.likesUsuarios).includes(user?.email) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={validLikes(selectedPost.likesUsuarios).includes(user?.email) ? '#FF6B8A' : 'rgba(255,255,255,0.8)'}
                  />
                  <Text style={styles.detailLikeBtnText}>
                    {validLikes(selectedPost.likesUsuarios).length}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : null}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.commentsHeader}>
                  {comments.length === 0
                    ? 'Sé la primera en comentar'
                    : `${comments.length} comentario${comments.length !== 1 ? 's' : ''}`}
                </Text>
              }
              renderItem={({ item }) => <CommentItem comment={item} />}
            />

            <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.inputAvatar}>
                <Text style={styles.inputAvatarText}>
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Escribe un comentario..."
                placeholderTextColor="#CCC"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerContent: {
    height: 85,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },

  // main toggle
  mainToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5E8EC',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 4,
  },
  mainToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 13,
  },
  mainToggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  mainToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0A0A8',
  },
  mainToggleTextActive: {
    color: '#BF789C',
    fontWeight: '700',
  },

  // tips search
  tipsSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tipsSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tipsEmptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  tipsEmptyText: {
    color: '#D6A4A4',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  searchResultLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginRight: 8,
  },
  searchResultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  searchResultDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },

  // tips layout
  tipsScroll: {
    paddingTop: 20,
    paddingHorizontal: 18,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  paraTimBadge: {
    backgroundColor: '#F5E0EC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 4,
  },
  paraTimBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BF789C',
  },
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
  featuredImage: { flex: 1 },
  featuredImageRadius: { borderRadius: 24 },
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
  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  featuredSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  quickTipCard: {
    marginHorizontal: 4,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  quickTipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BF789C',
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickTipText: {
    fontSize: 14,
    color: '#5A3050',
    lineHeight: 21,
    fontWeight: '500',
  },
  consejosBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  consejosBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
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

  // preview chips
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  previewChip: {
    backgroundColor: '#FDF0F5',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EDD8E4',
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BF789C',
    maxWidth: 130,
  },
  previewChipMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F5E8EC',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewChipMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BF789C',
  },

  // foro list
  forumList: { paddingTop: 20, paddingHorizontal: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  forumEmptyText: { fontSize: 15, color: '#CCC', fontWeight: '500' },

  // forum post card
  forumCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  forumCardImage: { width: '100%', height: 280 },
  forumCardImageStyle: { borderRadius: 24 },
  forumCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    gap: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(222,180,204,0.85)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryPillText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  forumCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  forumCardActions: { flexDirection: 'row', gap: 16 },
  forumCardAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  forumCardActionText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },

  // detail modal
  detailScreen: { flex: 1, backgroundColor: '#FDF5F8' },
  detailImage: { width: SCREEN_WIDTH, height: 300 },
  detailGradient: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  detailLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailLikeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // comments
  commentsList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  commentsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDD0E2',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { fontSize: 14, fontWeight: '800', color: '#BF789C' },
  commentBubble: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  commentAuthorForo: { fontSize: 12, fontWeight: '700', color: '#BF789C', marginBottom: 3 },
  commentTextForo: { fontSize: 14, color: '#444', lineHeight: 20 },

  // input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5E8EC',
    backgroundColor: '#FDF5F8',
  },
  inputAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDD0E2',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  inputAvatarText: { fontSize: 14, fontWeight: '800', color: '#BF789C' },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F0DDE2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D2D2D',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#BF789C',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#E2C8D4' },

  // fab
  fab: {
    position: 'absolute',
    right: 22,
    width: 56, height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  fabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // question card
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  questionAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDD0E2',
    justifyContent: 'center', alignItems: 'center',
  },
  questionAvatarText: { fontSize: 14, fontWeight: '800', color: '#BF789C' },
  questionAuthor: { fontSize: 14, fontWeight: '700', color: '#2D2D2D' },
  questionText: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14 },
  questionFooter: { flexDirection: 'row', gap: 16 },
  questionAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  questionActionText: { fontSize: 13, fontWeight: '600', color: '#CCC' },

  // create post modal
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5E8EC',
  },
  createHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#2D2D2D' },
  createPublishBtn: { fontSize: 15, fontWeight: '800', color: '#BF789C' },
  createBody: {
    flexDirection: 'row',
    padding: 20,
    gap: 14,
    flex: 1,
  },
  createAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDD0E2',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  createAvatarText: { fontSize: 16, fontWeight: '800', color: '#BF789C' },
  createInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    textAlignVertical: 'top',
  },

  // detail for question posts (no image)
  detailQuestionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  detailQuestionBack: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  detailQuestionContent: { gap: 10 },
  detailQuestionAuthor: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  detailQuestionText: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28 },
});
