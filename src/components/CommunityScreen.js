import React, { useState } from 'react';
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
  'Para rizadas':      { image: rizadasImage,    icon: 'water-outline' },
  'Para lisas':        { image: lisasImage,       icon: 'sunny-outline' },
  'Transición capilar':{ image: transicionImage,  icon: 'leaf-outline' },
  'Skincare':          { image: skincareImage,     icon: 'heart-outline' },
  'Mejores peluquerías':{ image: peluqueriasImage, icon: 'cut-outline' },
  'Colorimetría':      { image: colorimetriaImage, icon: 'color-palette-outline' },
};

const getSectionMeta = (title) =>
  sectionMeta[title] || { image: rizadasImage, icon: 'sparkles-outline' };

const initialPosts = [
  {
    id: '1', author: 'María', avatar: 'MA',
    topic: 'Hair', category: 'hair',
    body: '¿Alguien tiene tips para hidratar cabello muy seco sin usar siliconas?',
    likes: 8,
    comments: [
      { id: '1', author: 'Ana', avatar: 'AN', text: 'Prueba la mascarilla de aguacate una vez por semana.' },
      { id: '2', author: 'Sofía', avatar: 'SO', text: 'Me funcionó mucho el aceite de coco en las puntas.' },
    ],
  },
  {
    id: '2', author: 'Claudia', avatar: 'CL',
    topic: 'Skincare', category: 'skincare',
    body: 'Busco un serum ligero para piel mixta y sensible.',
    likes: 5,
    comments: [
      { id: '1', author: 'Laura', avatar: 'LA', text: 'Busca productos con niacinamida y sin fragancia.' },
    ],
  },
];

const TOPIC_COLORS = {
  hair: { bg: '#FDF0F3', text: '#C47898' },
  skincare: { bg: '#F0EDF8', text: '#8B78C4' },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('tips');

  // foro state
  const [posts, setPosts] = useState(initialPosts);
  const [likedPosts, setLikedPosts] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [forumView, setForumView] = useState('feed'); // 'feed' | 'creating' | 'detail'
  const [postTopic, setPostTopic] = useState('hair');
  const [postBody, setPostBody] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const addPost = () => {
    if (!postBody.trim()) return;
    const newPost = {
      id: String(Date.now()),
      author: 'Tú',
      avatar: 'TÚ',
      topic: postTopic === 'hair' ? 'Hair' : 'Skincare',
      category: postTopic,
      body: postBody.trim(),
      likes: 0,
      comments: [],
    };
    setPosts((p) => [newPost, ...p]);
    setPostBody('');
    setPostTopic('hair');
    setForumView('feed');
  };

  const addComment = () => {
    if (!commentText.trim() || !selectedPost) return;
    const newComment = {
      id: String(Date.now()),
      author: 'Tú',
      avatar: 'TÚ',
      text: commentText.trim(),
    };
    const updated = posts.map((p) =>
      p.id === selectedPost.id ? { ...p, comments: [...p.comments, newComment] } : p
    );
    setPosts(updated);
    setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, newComment] });
    setCommentText('');
  };

  const toggleLike = (postId) => {
    const isLiked = likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + (isLiked ? -1 : 1) } : p
      )
    );
  };

  const openDetail = (post) => {
    setSelectedPost(post);
    setForumView('detail');
  };

  const filteredPosts =
    selectedFilter === 'all' ? posts : posts.filter((p) => p.category === selectedFilter);

  const showToggle = !(activeTab === 'comunidad' && forumView !== 'feed');

  // ── Tips search ──────────────────────────────────────────────────────────────

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

  // ── Render tips ──────────────────────────────────────────────────────────────

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
        /* Normal layout */
        categories.map((section) => {
          const { image, icon } = getSectionMeta(section.title);
          return (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name={icon} size={13} color="#D6A4A4" />
                <Text style={styles.sectionLabel}>{section.title}</Text>
              </View>

              <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9}>
                <ImageBackground source={image} style={styles.featuredImage} imageStyle={styles.featuredImageRadius}>
                  <LinearGradient
                    colors={['transparent', 'rgba(30,10,20,0.72)']}
                    style={styles.featuredOverlay}
                  >
                    <Text style={styles.featuredTag}>Destacado</Text>
                    <Text style={styles.featuredTitle}>{section.title}</Text>
                    <Text style={styles.featuredSub} numberOfLines={2}>
                      Descubre consejos y rutinas para tu cabello.
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
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
          );
        })
      )}
    </ScrollView>
  );

  // ── Render community feed ────────────────────────────────────────────────────

  const renderFeed = () => (
    <View style={{ flex: 1 }}>
      {/* filter chips */}
      <View style={styles.filterRow}>
        {['all', 'hair', 'skincare'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
            onPress={() => setSelectedFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, selectedFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'Todos' : f === 'hair' ? 'Hair' : 'Skincare'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.feedList, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.postCard} activeOpacity={0.88} onPress={() => openDetail(item)}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatarWrap}>
                <Text style={styles.postAvatarText}>{item.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.postAuthor}>{item.author}</Text>
                <View style={[styles.topicBadge, { backgroundColor: TOPIC_COLORS[item.category]?.bg || '#FDF0F3' }]}>
                  <Text style={[styles.topicBadgeText, { color: TOPIC_COLORS[item.category]?.text || '#C47898' }]}>
                    {item.topic}
                  </Text>
                </View>
              </View>
              <Text style={styles.postCommentCount}>
                <Ionicons name="chatbubble-outline" size={12} color="#CCC" /> {item.comments.length}
              </Text>
            </View>

            <Text style={styles.postBody}>{item.body}</Text>

            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.likeBtn}
                onPress={() => toggleLike(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={likedPosts[item.id] ? 'heart' : 'heart-outline'}
                  size={15}
                  color={likedPosts[item.id] ? '#D6A4A4' : '#CCC'}
                />
                <Text style={[styles.likeCount, likedPosts[item.id] && { color: '#D6A4A4' }]}>
                  {item.likes}
                </Text>
              </TouchableOpacity>
              <View style={styles.readMoreRow}>
                <Text style={styles.readMoreText}>Ver comentarios</Text>
                <Ionicons name="chevron-forward" size={13} color="#D6A4A4" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={40} color="#E8D0D8" />
            <Text style={styles.emptyText}>Sé la primera en publicar</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => setForumView('creating')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── Render create post ───────────────────────────────────────────────────────

  const renderCreatePost = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.createScroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => setForumView('feed')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#BF789C" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.sectionTitleRow}>
          <Ionicons name="create-outline" size={13} color="#D6A4A4" />
          <Text style={styles.sectionLabel}>Nueva publicación</Text>
        </View>

        <View style={styles.createCard}>
          <Text style={styles.createFieldLabel}>Tema</Text>
          <View style={styles.topicToggle}>
            {['hair', 'skincare'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.topicBtn, postTopic === t && styles.topicBtnActive]}
                onPress={() => setPostTopic(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.topicBtnText, postTopic === t && styles.topicBtnTextActive]}>
                  {t === 'hair' ? 'Hair' : 'Skincare'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.createFieldLabel}>¿Qué quieres compartir?</Text>
          <TextInput
            style={styles.createInput}
            placeholder="Escribe tu pregunta o comentario..."
            placeholderTextColor="#CCC"
            value={postBody}
            onChangeText={setPostBody}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !postBody.trim() && { opacity: 0.5 }]}
          onPress={addPost}
          disabled={!postBody.trim()}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
            <Ionicons name="paper-plane-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitText}>Publicar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Render post detail ───────────────────────────────────────────────────────

  const renderDetail = () => {
    if (!selectedPost) return null;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.detailScroll, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backRow} onPress={() => setForumView('feed')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color="#BF789C" />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          {/* post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatarWrap}>
                <Text style={styles.postAvatarText}>{selectedPost.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.postAuthor}>{selectedPost.author}</Text>
                <View style={[styles.topicBadge, { backgroundColor: TOPIC_COLORS[selectedPost.category]?.bg || '#FDF0F3' }]}>
                  <Text style={[styles.topicBadgeText, { color: TOPIC_COLORS[selectedPost.category]?.text || '#C47898' }]}>
                    {selectedPost.topic}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.postBody}>{selectedPost.body}</Text>
          </View>

          {/* comments */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbubble-outline" size={13} color="#D6A4A4" />
            <Text style={styles.sectionLabel}>Comentarios · {selectedPost.comments.length}</Text>
          </View>

          {selectedPost.comments.length === 0 && (
            <Text style={styles.emptyComments}>Sé la primera en comentar.</Text>
          )}

          {selectedPost.comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentAvatarWrap}>
                <Text style={styles.commentAvatarText}>{c.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>{c.author}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}

          {/* comment input */}
          <View style={styles.commentInputCard}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#CCC"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.45 }]}
              onPress={addComment}
              disabled={!commentText.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.commentSendGradient}>
                <Ionicons name="send" size={15} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

      {showToggle && (
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
            style={[styles.mainToggleBtn, activeTab === 'comunidad' && styles.mainToggleBtnActive]}
            onPress={() => { setActiveTab('comunidad'); setForumView('feed'); }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'comunidad' ? 'people' : 'people-outline'}
              size={14}
              color={activeTab === 'comunidad' ? '#BF789C' : '#C0A0A8'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.mainToggleText, activeTab === 'comunidad' && styles.mainToggleTextActive]}>
              Foro
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'tips' && renderTips()}
      {activeTab === 'comunidad' && forumView === 'feed' && renderFeed()}
      {activeTab === 'comunidad' && forumView === 'creating' && renderCreatePost()}
      {activeTab === 'comunidad' && forumView === 'detail' && renderDetail()}
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

  // tips
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
  featuredSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
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

  // forum feed
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 99,
    backgroundColor: '#F5E8EC',
  },
  filterChipActive: {
    backgroundColor: '#D6A4A4',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C0A0A8',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  feedList: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  postAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.5,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  postCommentCount: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
  },
  postBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
    marginBottom: 14,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCC',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    color: '#D6A4A4',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // create post
  createScroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  backText: {
    color: '#BF789C',
    fontSize: 14,
    fontWeight: '700',
  },
  createCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 4,
  },
  createFieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  topicToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  topicBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F5E8EC',
  },
  topicBtnActive: {
    backgroundColor: '#D6A4A4',
  },
  topicBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0A0A8',
  },
  topicBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5E8EC',
    marginBottom: 16,
  },
  createInput: {
    minHeight: 120,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // detail / comments
  detailScroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  emptyComments: {
    color: '#CCC',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  commentAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.3,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 3,
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
  commentInputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginTop: 8,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    lineHeight: 20,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  commentSendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
