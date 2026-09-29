import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, FlatList,
  Platform, TouchableWithoutFeedback, Linking, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import ProductsScreen from './ProductsScreen';
import { searchNearbySalons, mapsUrl } from '../services/googlePlaces';
import { useCart } from '../context/CartContext';
import { fetchAllProducts } from '../firebase/products';
import { buildAmazonUrl } from '../utils/amazonUtils';
import { normalizeHorarioDay } from '../utils/scheduling';
import { haversineKm } from '../utils/geo';
import { logError } from '../services/errorReporting';

// ─── helpers ─────────────────────────────────────────────────────────────────

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getHorarioHoy(horarios, openNow) {
  if (horarios) {
    const dia = DIAS[new Date().getDay()];
    const h = horarios[dia];
    if (!h?.activo) return 'Cerrado hoy';
    return `${h.abre} – ${h.cierra}`;
  }
  if (openNow === true)  return 'Abierto ahora';
  if (openNow === false) return 'Cerrado ahora';
  return null;
}

function getTimeSlots(horarios, fechaStr) {
  if (!fechaStr || !horarios) return [];
  const d = new Date(fechaStr + 'T12:00:00');
  const dia = DIAS[d.getDay()];
  const h = horarios[dia];
  if (!h?.activo) return [];
  const [abreH, abreM] = h.abre.split(':').map(Number);
  const [cierraH] = h.cierra.split(':').map(Number);
  const slots = [];
  for (let hr = abreH; hr < cierraH; hr++) {
    slots.push(`${String(hr).padStart(2, '0')}:${String(abreM).padStart(2, '0')}`);
  }
  return slots;
}

function getNextDays(n = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: i === 0 ? 'Hoy' : `${DIAS_LABEL[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`,
      value: d.toISOString().split('T')[0],
    });
  }
  return days;
}

const FILTERS = ['Tradicional', 'Para rizadas'];

// ─── sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating, size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#F5A623"
        />
      ))}
    </View>
  );
}

function PeluqueriaCard({ peluqueria, distancia, onVerPerfil, onReservar }) {
  const horarioHoy = getHorarioHoy(peluqueria.horarios, peluqueria.openNow);
  const abierto = horarioHoy !== 'Cerrado hoy' && horarioHoy !== 'Cerrado ahora';
  const esCurly = peluqueria.tipo === 'Para rizadas';
  const isGoogle = peluqueria.isGooglePlace;
  const esReservable = !isGoogle && peluqueria.businessType === 'peluqueria' && !!onReservar;

  const llamar   = () => Linking.openURL(`tel:${peluqueria.telefono}`);
  const whatsapp = () => Linking.openURL(`whatsapp://send?phone=57${peluqueria.telefono}`);
  const verMaps  = () => Linking.openURL(mapsUrl(peluqueria));

  return (
    <TouchableOpacity style={styles.peluqueriaCard} onPress={onVerPerfil} activeOpacity={0.92}>
      <View style={styles.peluqueriaCardTop}>
        <View style={styles.peluqueriaAvatar}>
          <Ionicons name="cut-outline" size={22} color="#BF789C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.peluqueriaNombre}>{peluqueria.nombre}</Text>
          <View style={[styles.tipoBadge, esCurly ? styles.tipoBadgeCurly : styles.tipoBadgeTrad]}>
            <Text style={[styles.tipoBadgeText, esCurly ? styles.tipoBadgeTextCurly : styles.tipoBadgeTextTrad]}>
              {esCurly ? '✦ Para rizadas' : '✂ Tradicional'}
            </Text>
          </View>
        </View>
        {distancia != null && (
          <View style={styles.distanciaBadge}>
            <Ionicons name="location-outline" size={11} color="#BF789C" />
            <Text style={styles.distanciaText}>
              {distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.peluqueriaCardMid}>
        <Ionicons name="map-outline" size={12} color="#BBB" />
        <Text style={styles.peluqueriaDireccion} numberOfLines={1}>{peluqueria.direccion}</Text>
      </View>

      <View style={styles.peluqueriaCardBottom}>
        <StarRating rating={peluqueria.rating} />
        <Text style={styles.ratingNum}>{peluqueria.rating?.toFixed(1)}</Text>
        <Text style={styles.ratingCount}>({peluqueria.totalResenias})</Text>
        <View style={{ flex: 1 }} />
        {horarioHoy && (
          <View style={[styles.horarioBadge, !abierto && styles.horarioCerrado]}>
            <Text style={[styles.horarioText, !abierto && styles.horarioTextCerrado]}>
              {horarioHoy}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActionsRow}>
        {!isGoogle && peluqueria.telefono && (
          <>
            <TouchableOpacity
              style={styles.contactIconBtn}
              onPress={llamar}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Llamar a la peluquería"
            >
              <Ionicons name="call-outline" size={17} color="#BF789C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconBtn, { marginRight: 8 }]}
              onPress={whatsapp}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Contactar por WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
            </TouchableOpacity>
          </>
        )}
        {esReservable ? (
          <TouchableOpacity
            style={[styles.reservarBtn, { flex: 1 }]}
            onPress={onReservar}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Reservar cita en ${peluqueria.nombre}`}
          >
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reservarBtnGradient}
            >
              <Ionicons name="calendar-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.reservarBtnText}>Reservar</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.reservarBtn, { flex: 1 }]} onPress={verMaps} activeOpacity={0.85}>
            <LinearGradient
              colors={['#4A90E2', '#2D6DB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reservarBtnGradient}
            >
              <Ionicons name="map-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.reservarBtnText}>Ver en Maps</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ExplorarScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart } = useCart();

  const [activeTab, setActiveTab] = useState('productos');

  // ── Catálogo completo ──
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'catalogo') {
      setCatalogLoading(true);
      fetchAllProducts()
        .then(data => {
          const sorted = [...data].sort((a, b) =>
            (a.brand || '').localeCompare(b.brand || '') || (a.name || '').localeCompare(b.name || '')
          );
          setCatalogProducts(sorted);
        })
        .finally(() => setCatalogLoading(false));
    }
  }, [activeTab]);

  // peluquerías
  const [peluquerias, setPeluquerias]       = useState([]);
  const [loadingPelu, setLoadingPelu]       = useState(true);
  const [userLocation, setUserLocation]     = useState(null);
  const [userCity, setUserCity]             = useState(null);
  const [selectedCity, setSelectedCity]     = useState(null); // null = todas las ciudades
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const cityAutoSetRef = useRef(false);
  const [selectedFilter, setSelectedFilter] = useState('Tradicional');
  const [hairProfile, setHairProfile]       = useState(null);
  const [filterPersonalizado, setFilterPersonalizado] = useState(false);
  const [diagnosisStoreId, setDiagnosisStoreId] = useState(null);

  // Google Places
  const [googlePlaces, setGooglePlaces]     = useState([]);
  const [loadingGoogle, setLoadingGoogle]   = useState(false);
  const [googleError, setGoogleError]       = useState(null);

  // modal perfil
  const [perfilModal, setPerfilModal] = useState({ visible: false, peluqueria: null });
  const [resenias, setResenias]       = useState([]);

  // modal reserva

  // modal reseña
  const [reseniaModal, setReseniaModal]     = useState(false);
  const [reseniaPuntos, setReseniaPuntos]   = useState(0);
  const [reseniaTexto, setReseniaTexto]     = useState('');
  const [guardandoResenia, setGuardandoResenia] = useState(false);

  useEffect(() => {
    fetchPeluquerias();
    requestLocation();
    AsyncStorage.getItem('@mybeauty-calendar:hairProfile')
      .then(raw => { if (raw) setHairProfile(JSON.parse(raw)); })
      .catch(() => {});
    AsyncStorage.getItem('@mybeauty-calendar:selectedStoreId')
      .then(raw => { if (raw) setDiagnosisStoreId(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hairProfile) return;
    if (hairProfile.isCurlyOrWavy || hairProfile.isCoily) {
      setSelectedFilter('Para rizadas');
      setFilterPersonalizado(true);
    } else if (hairProfile.isLacio) {
      setSelectedFilter('Tradicional');
      setFilterPersonalizado(true);
    }
  }, [hairProfile]);

  useEffect(() => {
    if (userCity && !cityAutoSetRef.current) {
      cityAutoSetRef.current = true;
      setSelectedCity(userCity);
    }
  }, [userCity]);

  useEffect(() => {
    if (!userLocation) return;
    setGoogleError(null);
    setLoadingGoogle(true);
    searchNearbySalons(userLocation.latitude, userLocation.longitude, { tipo: selectedFilter })
      .then(setGooglePlaces)
      .catch(e => setGoogleError(e.message))
      .finally(() => setLoadingGoogle(false));
  }, [userLocation, selectedFilter]);

  const fetchPeluquerias = async () => {
    try {
      const snap = await getDocs(collection(db, 'peluquerias'));
      const data = snap.docs
        .filter(d => !d.data()._info)
        .map(d => ({ id: d.id, ...d.data() }));
      setPeluquerias(data);
    } catch (error) {
      logError(error, 'ExplorarScreen.fetchPeluquerias');
    }
    setLoadingPelu(false);
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation(loc.coords);
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      const city = place?.city || place?.subregion || place?.region || null;
      setUserCity(city);
    } catch {}
  };

  const fetchResenias = async (peluqueriaId) => {
    try {
      const snap = await getDocs(
        query(collection(db, 'resenias'), orderBy('creadoEn', 'desc'))
      );
      const data = snap.docs
        .filter(d => d.data().peluqueriaId === peluqueriaId && !d.data()._info)
        .map(d => ({ id: d.id, ...d.data() }));
      setResenias(data);
    } catch (error) {
      logError(error, 'ExplorarScreen.fetchResenias');
      setResenias([]);
    }
  };

  const openPerfil = (peluqueria) => {
    setPerfilModal({ visible: true, peluqueria });
    fetchResenias(peluqueria.id);
  };


  const guardarResenia = async () => {
    if (!reseniaPuntos || !reseniaTexto.trim()) return;
    setGuardandoResenia(true);
    try {
      await addDoc(collection(db, 'resenias'), {
        clienteUid: user?.uid || '',
        clienteNombre: user?.displayName || 'Anónimo',
        peluqueriaId: perfilModal.peluqueria.id,
        puntuacion: reseniaPuntos,
        comentario: reseniaTexto.trim(),
        creadoEn: serverTimestamp(),
      });
      setReseniaModal(false);
      setReseniaPuntos(0);
      setReseniaTexto('');
      fetchResenias(perfilModal.peluqueria.id);
    } catch (error) {
      logError(error, 'ExplorarScreen.guardarResenia');
    }
    setGuardandoResenia(false);
  };

  const getHairTypeName = (profile) => {
    if (!profile) return null;
    if (profile.isCoily) return 'Afrorizado';
    if (profile.isRizado) return 'Rizado';
    if (profile.isOndulado) return 'Ondulado';
    if (profile.isTransicion) return 'Transición capilar';
    if (profile.isLacio) return 'Lacio';
    return null;
  };

  const availableCities = [...new Set(peluquerias.map(p => p.ciudad).filter(Boolean))].sort();

  const peluqueriasFiltradas = peluquerias
    // Esta pestaña es solo para peluquerías (donde se puede reservar cita).
    // businessType='peluqueria' es explícito. Si falta el campo, solo se
    // trata como peluquería real cuando además no tiene ownerId — las
    // curadas a mano (sembradas en consola, antes de este campo) nunca
    // tienen ownerId; cualquier doc creado desde el panel de empresas sí lo
    // tiene, así que una tienda vieja sin businessType (ej. "palatsi prueba"
    // antes de parchearse) cae del lado correcto y no se cuela acá.
    .filter(p => p.businessType === 'peluqueria' || (!p.businessType && !p.ownerId))
    .filter(p => !p.tipo || p.tipo === selectedFilter)
    .filter(p => !selectedCity || (p.ciudad || '').toLowerCase() === selectedCity.toLowerCase())
    .map(p => ({
      ...p,
      distancia: userLocation && p.lat != null && p.lng != null
        ? haversineKm(userLocation.latitude, userLocation.longitude, p.lat, p.lng)
        : null,
    }))
    .sort((a, b) => {
      if (a.distancia == null) return 1;
      if (b.distancia == null) return -1;
      return a.distancia - b.distancia;
    });

  // Tienda elegida en el diagnóstico (guardada en AsyncStorage por
  // DiagnosisScreen) — se muestra fija arriba de todo, ajena a los filtros de
  // ciudad/tipo, para que siempre sea fácil volver a reservar ahí. Solo si es
  // una peluquería reservable (una tienda de productos no tendría sentido acá).
  const diagnosisStore = diagnosisStoreId
    ? peluquerias.find(p => p.id === diagnosisStoreId && p.businessType === 'peluqueria')
    : null;
  const diagnosisStoreDistancia = diagnosisStore && userLocation && diagnosisStore.lat != null && diagnosisStore.lng != null
    ? haversineKm(userLocation.latitude, userLocation.longitude, diagnosisStore.lat, diagnosisStore.lng)
    : null;

  // Lista única de "peluquerías cerca de ti": las propias (reservables o
  // curadas) más las de Google Maps, todas juntas y ordenadas por distancia
  // real. La del diagnóstico se excluye acá porque ya se muestra fija arriba.
  const cercaDeTi = [
    ...peluqueriasFiltradas.filter(p => p.id !== diagnosisStore?.id),
    ...googlePlaces.map(p => ({
      ...p,
      distancia: userLocation ? haversineKm(userLocation.latitude, userLocation.longitude, p.lat, p.lng) : null,
    })),
  ].sort((a, b) => {
    if (a.distancia == null) return 1;
    if (b.distancia == null) return -1;
    return a.distancia - b.distancia;
  });

  const nextDays = getNextDays(7);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── header ── */}
      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Explorar</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartHeaderBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ver carrito"
          >
            <Ionicons name="bag-outline" size={20} color="#fff" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'productos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('productos')}
            activeOpacity={0.8}
          >
            <Ionicons name="flask-outline" size={14} color={activeTab === 'productos' ? '#BF789C' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.tabBtnText, activeTab === 'productos' && styles.tabBtnTextActive]}>
              Productos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'peluquerias' && styles.tabBtnActive]}
            onPress={() => setActiveTab('peluquerias')}
            activeOpacity={0.8}
          >
            <Ionicons name="cut-outline" size={14} color={activeTab === 'peluquerias' ? '#BF789C' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.tabBtnText, activeTab === 'peluquerias' && styles.tabBtnTextActive]}>
              Peluquerías
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'catalogo' && styles.tabBtnActive]}
            onPress={() => setActiveTab('catalogo')}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={14} color={activeTab === 'catalogo' ? '#BF789C' : 'rgba(255,255,255,0.75)'} />
            <Text style={[styles.tabBtnText, activeTab === 'catalogo' && styles.tabBtnTextActive]}>
              Catálogo
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── tab: productos ── */}
      {activeTab === 'productos' && (
        <ProductsScreen
          route={route || { params: {} }}
          navigation={navigation}
          hideHeader
        />
      )}

      {/* ── tab: peluquerías ── */}
      {activeTab === 'peluquerias' && (
        <FlatList
          data={cercaDeTi}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.peluScroll}
          renderItem={({ item: p }) => (
            <PeluqueriaCard
              peluqueria={p}
              distancia={p.distancia}
              onVerPerfil={p.isGooglePlace ? undefined : () => openPerfil(p)}
              onReservar={p.isGooglePlace ? undefined : () => navigation.navigate('ReservarCita', {
                storeId: p.id,
                storeName: p.nombre,
                horarios: p.horarios,
              })}
            />
          )}
          ListHeaderComponent={
            <>
              {/* peluquería elegida en el diagnóstico — fija arriba de todo, ajena
                  a los filtros de ciudad/tipo */}
              {diagnosisStore && (
                <>
                  <Text style={styles.misReservasTitle}>TU PELUQUERÍA DEL DIAGNÓSTICO</Text>
                  <PeluqueriaCard
                    peluqueria={diagnosisStore}
                    distancia={diagnosisStoreDistancia}
                    onVerPerfil={() => openPerfil(diagnosisStore)}
                    onReservar={() => navigation.navigate('ReservarCita', {
                      storeId: diagnosisStore.id,
                      storeName: diagnosisStore.nombre,
                      horarios: diagnosisStore.horarios,
                    })}
                  />
                </>
              )}

              {/* selector de ciudad */}
              {availableCities.length > 0 && (
                <TouchableOpacity
                  style={styles.cityBanner}
                  onPress={() => setCityModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar ciudad"
                >
                  <Ionicons name="location" size={14} color="#BF789C" />
                  <Text style={styles.cityBannerText} numberOfLines={1}>
                    {selectedCity || 'Todas las ciudades'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#BF789C" />
                </TouchableOpacity>
              )}

              {/* banner de personalización */}
              {filterPersonalizado && hairProfile && getHairTypeName(hairProfile) && (
                <View style={styles.hairBanner}>
                  <Ionicons name="sparkles-outline" size={13} color="#BF789C" />
                  <Text style={styles.hairBannerText}>
                    Mostrando peluquerías para cabello{' '}
                    <Text style={styles.hairBannerBold}>{getHairTypeName(hairProfile)}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setSelectedFilter('Tradicional'); setFilterPersonalizado(false); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar filtro personalizado"
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#D6A4A4" />
                  </TouchableOpacity>
                </View>
              )}

              {/* filtros */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                {FILTERS.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
                    onPress={() => { setSelectedFilter(f); setFilterPersonalizado(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, selectedFilter === f && styles.filterChipTextActive]}>
                      {f}
                    </Text>
                    {filterPersonalizado && selectedFilter === f && (
                      <View style={styles.filterParaTiDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* lista única: tus peluquerías registradas + las cercanas de Google
                  Maps, todas juntas y ordenadas por distancia real — sin separar
                  en secciones que puedan verse como contradictorias entre sí. */}
              <Text style={styles.misReservasTitle}>
                {diagnosisStore ? 'OTRAS PELUQUERÍAS CERCA DE TI' : 'PELUQUERÍAS CERCA DE TI'}
              </Text>
            </>
          }
          ListEmptyComponent={
            (loadingPelu || (userLocation && loadingGoogle)) ? (
              <ActivityIndicator size="large" color="#D6A4A4" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={44} color="#EDD0D8" />
                <Text style={styles.emptyText}>
                  No encontramos peluquerías{selectedCity ? ` en ${selectedCity}` : ' cerca de ti'}.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <>
              {cercaDeTi.length > 0 && userLocation && googlePlaces.length > 0 && (
                <Text style={styles.googleAttrib}>Incluye resultados de Google Maps</Text>
              )}
              {googleError && userLocation && (
                <Text style={[styles.emptyText, { marginTop: 8 }]}>
                  {['REQUEST_DENIED', 'INVALID_REQUEST', 'EXPO_PUBLIC_GOOGLE_PLACES_KEY no configurada'].includes(googleError)
                    ? 'Falta configurar la Google Places API key.\nAbre el archivo .env y reemplaza TU_API_KEY_AQUI con tu clave de Google Cloud.'
                    : `No se pudieron cargar peluquerías cercanas de Google Maps.\n(${googleError})`}
                </Text>
              )}
            </>
          }
        />
      )}

      {/* ── Modal selector de ciudad ── */}
      <Modal visible={cityModalVisible} transparent animationType="fade" onRequestClose={() => setCityModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setCityModalVisible(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.reseniaSheet}>
                <Text style={styles.reservaTitulo}>Elegir ciudad</Text>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.cityOption, !selectedCity && styles.cityOptionActive]}
                    onPress={() => { setSelectedCity(null); setCityModalVisible(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cityOptionText, !selectedCity && styles.cityOptionTextActive]}>
                      Todas las ciudades
                    </Text>
                    {!selectedCity && <Ionicons name="checkmark" size={17} color="#BF789C" />}
                  </TouchableOpacity>
                  {availableCities.map(city => (
                    <TouchableOpacity
                      key={city}
                      style={[styles.cityOption, selectedCity === city && styles.cityOptionActive]}
                      onPress={() => { setSelectedCity(city); setCityModalVisible(false); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cityOptionText, selectedCity === city && styles.cityOptionTextActive]}>
                        {city}
                      </Text>
                      {selectedCity === city && <Ionicons name="checkmark" size={17} color="#BF789C" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal perfil peluquería ── */}
      <Modal
        visible={perfilModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPerfilModal({ visible: false, peluqueria: null })}
      >
        <TouchableWithoutFeedback onPress={() => setPerfilModal({ visible: false, peluqueria: null })}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.perfilSheet}>
                <View style={styles.modalHandle} />

                {perfilModal.peluqueria && (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* nombre */}
                    <Text style={styles.perfilNombre}>{perfilModal.peluqueria.nombre}</Text>
                    <Text style={styles.perfilDireccion}>{perfilModal.peluqueria.direccion}</Text>

                    {/* rating */}
                    <View style={styles.perfilRatingRow}>
                      <StarRating rating={perfilModal.peluqueria.rating} size={16} />
                      <Text style={styles.perfilRatingNum}>{perfilModal.peluqueria.rating?.toFixed(1)}</Text>
                      <Text style={styles.perfilRatingCount}>· {perfilModal.peluqueria.totalResenias} reseñas</Text>
                    </View>

                    {/* contacto */}
                    {perfilModal.peluqueria?.telefono && (
                      <View style={styles.perfilContactRow}>
                        <TouchableOpacity
                          style={styles.perfilContactBtn}
                          onPress={() => Linking.openURL(`tel:${perfilModal.peluqueria.telefono}`)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call-outline" size={17} color="#BF789C" />
                          <Text style={styles.perfilContactText}>Llamar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.perfilContactBtn, styles.perfilContactBtnWA]}
                          onPress={() => Linking.openURL(`whatsapp://send?phone=57${perfilModal.peluqueria.telefono}`)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                          <Text style={[styles.perfilContactText, { color: '#25D366' }]}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* reservar cita — solo peluquerías (businessType='peluqueria';
                        undefined se trata como 'tienda', no muestra el botón) */}
                    {perfilModal.peluqueria?.businessType === 'peluqueria' && (
                      <TouchableOpacity
                        style={styles.reservarBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          // Hay que cerrar el modal de perfil antes de navegar: al
                          // ser un <Modal> nativo, se queda flotando por encima de
                          // ReservarCitaScreen y tapa los servicios si sigue abierto.
                          const p = perfilModal.peluqueria;
                          setPerfilModal({ visible: false, peluqueria: null });
                          navigation.navigate('ReservarCita', {
                            storeId: p.id,
                            storeName: p.nombre,
                            horarios: p.horarios,
                          });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Reservar cita en ${perfilModal.peluqueria.nombre}`}
                      >
                        <LinearGradient
                          colors={['#DEB4CC', '#BF789C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.reservarBtnGradient}
                        >
                          <Ionicons name="calendar-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.reservarBtnText}>Reservar cita</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {/* especialidades */}
                    <View style={styles.especialidadesRow}>
                      {perfilModal.peluqueria.especialidades?.map(e => (
                        <View key={e} style={styles.especialidadChip}>
                          <Text style={styles.especialidadChipText}>{e}</Text>
                        </View>
                      ))}
                    </View>

                    {/* horarios — soporta el formato viejo curado a mano
                        ({activo, abre, cierra}) y el nuevo del panel de
                        empresas ([{inicio, fin}] | null) */}
                    <Text style={styles.perfilSectionLabel}>HORARIOS</Text>
                    {Object.entries(perfilModal.peluqueria.horarios || {}).map(([dia, h]) => {
                      const rangos = normalizeHorarioDay(h);
                      return (
                        <View key={dia} style={styles.horarioRow}>
                          <Text style={styles.horarioDia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Text>
                          <Text style={[styles.horarioHora, rangos.length === 0 && { color: '#CCC' }]}>
                            {rangos.length > 0
                              ? rangos.map((r) => `${r.inicio} – ${r.fin}`).join(', ')
                              : 'Cerrado'}
                          </Text>
                        </View>
                      );
                    })}

                    {/* reseñas */}
                    <View style={styles.reseniasTitleRow}>
                      <Text style={styles.perfilSectionLabel}>RESEÑAS</Text>
                      <TouchableOpacity onPress={() => setReseniaModal(true)} activeOpacity={0.8}>
                        <Text style={styles.agregarReseniaBtn}>+ Agregar</Text>
                      </TouchableOpacity>
                    </View>

                    {resenias.length === 0 ? (
                      <Text style={styles.sinResenias}>Aún no hay reseñas. ¡Sé la primera!</Text>
                    ) : (
                      resenias.map(r => (
                        <View key={r.id} style={styles.reseniaCard}>
                          <View style={styles.reseniaHeader}>
                            <Text style={styles.reseniaAutor}>{r.clienteNombre}</Text>
                            <StarRating rating={r.puntuacion} size={12} />
                          </View>
                          <Text style={styles.reseniaTexto}>{r.comentario}</Text>
                        </View>
                      ))
                    )}

                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal reseña ── */}
      <Modal visible={reseniaModal} transparent animationType="fade" onRequestClose={() => setReseniaModal(false)}>
        <TouchableWithoutFeedback onPress={() => setReseniaModal(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.reseniaSheet}>
                <Text style={styles.reservaTitulo}>Agregar reseña</Text>

                <Text style={styles.reservaLabel}>Puntuación</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setReseniaPuntos(n)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Calificar con ${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                      accessibilityState={{ selected: n <= reseniaPuntos }}
                    >
                      <Ionicons
                        name={n <= reseniaPuntos ? 'star' : 'star-outline'}
                        size={30}
                        color="#F5A623"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.reservaLabel}>Comentario</Text>
                <TextInput
                  style={[styles.reservaInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={reseniaTexto}
                  onChangeText={setReseniaTexto}
                  placeholder="¿Cómo fue tu experiencia?"
                  placeholderTextColor="#CCC"
                  multiline
                />

                <TouchableOpacity
                  style={[styles.reservarBtnLarge, { marginTop: 16 }, (!reseniaPuntos || !reseniaTexto.trim()) && { opacity: 0.4 }]}
                  disabled={!reseniaPuntos || !reseniaTexto.trim() || guardandoResenia}
                  onPress={guardarResenia}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Publicar reseña"
                  accessibilityState={{ disabled: !reseniaPuntos || !reseniaTexto.trim() || guardandoResenia }}
                >
                  <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.reservarBtnGradient}>
                    {guardandoResenia
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.reservarBtnText}>Publicar reseña</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelarBtn} onPress={() => setReseniaModal(false)}>
                  <Text style={styles.cancelarBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── tab: catálogo ── */}
      {activeTab === 'catalogo' && (
        <FlatList
          data={catalogProducts}
          keyExtractor={(product) => product.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.catalogScroll}
          ListHeaderComponent={
            <Text style={styles.catalogCount}>
              {catalogLoading ? 'Cargando...' : `${catalogProducts.length} productos en total`}
            </Text>
          }
          ListEmptyComponent={
            catalogLoading ? (
              <ActivityIndicator size="large" color="#D6A4A4" style={{ marginTop: 40 }} />
            ) : null
          }
          renderItem={({ item: product }) => {
            const hasImage = !!product.image;
            const hasAsin = !!product.asin;
            const fallbackUrl = product.sourceLink || product.link || null;
            const hasLink = !!(product.amazonLink || product.asin || fallbackUrl);
            const amazonUrl = buildAmazonUrl(product) || fallbackUrl;

            const statusColor = hasImage ? '#7ADA7A' : hasAsin ? '#FFB347' : '#FF6B6B';
            const statusLabel = hasImage ? 'imagen' : hasAsin ? 'solo ASIN' : 'sin imagen';

            return (
              <View style={styles.catalogItem}>
                <CatalogImage product={product} />
                <View style={styles.catalogInfo}>
                  <Text style={styles.catalogBrand} numberOfLines={1}>{product.brand}</Text>
                  <Text style={styles.catalogName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.catalogStatusRow}>
                    <View style={[styles.catalogDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.catalogStatus, { color: statusColor }]}>{statusLabel}</Text>
                    {product.amazonLink && (
                      <>
                        <View style={styles.catalogDot2} />
                        <Text style={styles.catalogLinkTag}>link propio</Text>
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => amazonUrl ? Linking.openURL(amazonUrl) : alert('Sin link de Amazon')}
                  style={[styles.catalogOpenBtn, !hasLink && styles.catalogOpenBtnDisabled]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir en Amazon"
                >
                  <Ionicons name="open-outline" size={15} color={hasLink ? '#BF789C' : '#CCC'} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function CatalogImage({ product }) {
  const [fallback, setFallback] = React.useState(0);
  const defaultImg = require('../../assets/icon.png');

  const src = React.useMemo(() => {
    if (product.image && fallback === 0) return { uri: product.image };
    if (!product.asin || fallback >= 2) return defaultImg;
    if (fallback <= 1) return { uri: `https://m.media-amazon.com/images/P/${product.asin}.01._SL500_.jpg` };
    return { uri: `https://images-na.ssl-images-amazon.com/images/P/${product.asin}.01.LZZZZZZZ.jpg` };
  }, [product.image, product.asin, fallback]);

  return (
    <Image
      source={src}
      style={styles.catalogImg}
      resizeMode="cover"
      onError={() => setFallback(f => f + 1)}
    />
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5F8' },

  // header
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cartHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BF789C',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  tabBtnTextActive: {
    color: '#BF789C',
  },

  // peluquerías scroll
  peluScroll: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 48,
  },
  misCitasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F0D8E8',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  misCitasBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BF789C',
  },
  cityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F0D8E8',
  },
  cityBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBF0',
  },
  cityOptionActive: {},
  cityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cityOptionTextActive: {
    color: '#BF789C',
    fontWeight: '800',
  },
  filtersRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EDD8DC',
  },
  filterChipActive: {
    backgroundColor: '#BF789C',
    borderColor: '#BF789C',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterParaTiDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },

  // banner cabello personalizado
  hairBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF0F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D5E8',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  hairBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#A07090',
    lineHeight: 17,
  },
  hairBannerBold: {
    fontWeight: '700',
    color: '#BF789C',
  },

  // card peluquería
  peluqueriaCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  peluqueriaCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  peluqueriaAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FDF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peluqueriaNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  peluqueriaEspecialidad: {
    fontSize: 12,
    color: '#BF789C',
    fontWeight: '600',
  },
  tipoBadge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 4,
  },
  tipoBadgeCurly: {
    backgroundColor: '#FAE8F4',
  },
  tipoBadgeTrad: {
    backgroundColor: '#EDF0FB',
  },
  tipoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tipoBadgeTextCurly: {
    color: '#BF789C',
  },
  tipoBadgeTextTrad: {
    color: '#7B7FCC',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FDF0F5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanciaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BF789C',
  },
  peluqueriaCardMid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  peluqueriaDireccion: {
    fontSize: 12,
    color: '#AAA',
    flex: 1,
  },
  peluqueriaCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  ratingCount: {
    fontSize: 12,
    color: '#AAA',
  },
  horarioBadge: {
    backgroundColor: '#EDFFF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  horarioCerrado: {
    backgroundColor: '#FFF0F0',
  },
  horarioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
  },
  horarioTextCerrado: {
    color: '#E57373',
  },
  reservarBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reservarBtnLarge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  reservarBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  reservarBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // mis reservas
  misReservasSection: {
    marginBottom: 20,
  },
  misReservasTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  misReservasScroll: {
    gap: 12,
    paddingRight: 4,
  },
  reservaCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  reservaCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  reservaCardNombre: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 5,
    paddingLeft: 4,
  },
  reservaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  reservaCardFecha: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  reservaEstadoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8EC',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginLeft: 4,
  },
  reservaEstadoConfirmada: {
    backgroundColor: '#EDFFF5',
  },
  reservaEstadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A020',
  },
  cancelarReservaBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },
  googleAttrib: {
    textAlign: 'center',
    fontSize: 11,
    color: '#CCC',
    marginTop: 4,
    marginBottom: 16,
  },

  // modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  perfilSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  reservaSheet: {
    backgroundColor: '#FDF5F8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  reservaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reservaCenteredSheet: {
    backgroundColor: '#FDF5F8',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  exitoBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  // calendar
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#F0E0E8',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarMonthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D2D2D',
    textTransform: 'capitalize',
  },
  calendarDayLabels: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#D6A4A4',
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#BF789C',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2D2D2D',
  },
  reseniaSheet: {
    backgroundColor: '#FDF5F8',
    borderRadius: 24,
    padding: 22,
    width: '100%',
  },

  // perfil modal
  perfilNombre: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  perfilDireccion: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 12,
  },
  perfilRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  perfilRatingNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  perfilRatingCount: {
    fontSize: 13,
    color: '#AAA',
  },
  especialidadesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  especialidadChip: {
    backgroundColor: '#FDF0F5',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  especialidadChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BF789C',
  },
  perfilContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  reservarBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  reservarBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  reservarBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  perfilContactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#FDF0F5',
    borderWidth: 1.5,
    borderColor: '#F0D8E8',
  },
  perfilContactBtnWA: {
    backgroundColor: '#F0FBF3',
    borderColor: '#C8EDD4',
  },
  perfilContactText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BF789C',
  },
  perfilSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  horarioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBF0',
  },
  horarioDia: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'capitalize',
  },
  horarioHora: {
    fontSize: 13,
    color: '#888',
  },
  reseniasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  agregarReseniaBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BF789C',
  },
  sinResenias: {
    fontSize: 13,
    color: '#BBB',
    textAlign: 'center',
    paddingVertical: 16,
  },
  reseniaCard: {
    backgroundColor: '#FDF5F8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reseniaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reseniaAutor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  reseniaTexto: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },

  // reserva modal
  reservaTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 20,
  },
  reservaLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  reservaInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#F0E0E8',
    marginBottom: 18,
  },
  fechasRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 18,
  },
  fechaChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EDD8DC',
  },
  fechaChipActive: {
    backgroundColor: '#BF789C',
    borderColor: '#BF789C',
  },
  fechaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  fechaChipTextActive: {
    color: '#fff',
  },
  horasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  horaChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EDD8DC',
  },
  horaChipActive: {
    backgroundColor: '#BF789C',
    borderColor: '#BF789C',
  },
  horaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  horaChipTextActive: {
    color: '#fff',
  },
  cerradoText: {
    fontSize: 13,
    color: '#E57373',
    fontWeight: '600',
    marginBottom: 12,
  },

  // éxito
  exitoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  exitoEmoji: { fontSize: 52 },
  exitoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  exitoSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },

  // cancelar
  cancelarBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F7F0F4',
  },
  cancelarBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BF789C',
  },

  // catálogo
  catalogScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  catalogCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D6A4A4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  catalogImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F7ECEE',
    flexShrink: 0,
  },
  catalogInfo: {
    flex: 1,
    gap: 2,
  },
  catalogBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D6A4A4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catalogName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 18,
  },
  catalogStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  catalogDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  catalogDot2: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginHorizontal: 2,
  },
  catalogStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  catalogLinkTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#BF789C',
    backgroundColor: '#F5E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  catalogOpenBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catalogOpenBtnDisabled: {
    backgroundColor: '#F5F5F5',
  },
});
