import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import ProductsScreen from './ProductsScreen';
import CitasModal from './CitasModal';

// ─── helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getHorarioHoy(horarios) {
  const dia = DIAS[new Date().getDay()];
  const h = horarios?.[dia];
  if (!h?.activo) return 'Cerrado hoy';
  return `${h.abre} – ${h.cierra}`;
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

const FILTERS = ['Todas', 'Tradicional', 'Para rizadas'];

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

function PeluqueriaCard({ peluqueria, distancia, onReservar, onVerPerfil }) {
  const horarioHoy = getHorarioHoy(peluqueria.horarios);
  const abierto = horarioHoy !== 'Cerrado hoy';
  const esCurly = peluqueria.tipo === 'Para rizadas';

  const llamar = () => Linking.openURL(`tel:${peluqueria.telefono}`);
  const whatsapp = () => Linking.openURL(`whatsapp://send?phone=57${peluqueria.telefono}`);

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
        <View style={[styles.horarioBadge, !abierto && styles.horarioCerrado]}>
          <Text style={[styles.horarioText, !abierto && styles.horarioTextCerrado]}>
            {horarioHoy}
          </Text>
        </View>
      </View>

      <View style={styles.cardActionsRow}>
        {peluqueria.telefono && (
          <>
            <TouchableOpacity style={styles.contactIconBtn} onPress={llamar} activeOpacity={0.8}>
              <Ionicons name="call-outline" size={17} color="#BF789C" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactIconBtn, { marginRight: 8 }]} onPress={whatsapp} activeOpacity={0.8}>
              <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={[styles.reservarBtn, { flex: 1 }]} onPress={onReservar} activeOpacity={0.85}>
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
      </View>
    </TouchableOpacity>
  );
}

function MiniCalendar({ selectedDate, onSelect }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const today = new Date(); today.setHours(0,0,0,0);
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const goBack = () => {
    const prev = new Date(year, month - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setViewDate(prev);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#BF789C" />
        </TouchableOpacity>
        <Text style={styles.calendarMonthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color="#BF789C" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarDayLabels}>
        {DAY_LABELS.map(l => <Text key={l} style={styles.calendarDayLabel}>{l}</Text>)}
      </View>

      <View style={styles.calendarGrid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.calendarCell} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;
          const isSelected = selectedDate === dateStr;
          const isToday = cellDate.getTime() === today.getTime();

          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.calendarCell}
              onPress={() => !isPast && onSelect(dateStr)}
              activeOpacity={isPast ? 1 : 0.75}
              disabled={isPast}
            >
              {isSelected ? (
                <LinearGradient colors={['#DEB4CC', '#BF789C']} style={styles.calendarDayCircle}>
                  <Text style={[styles.calendarDayText, { color: '#fff', fontWeight: '800' }]}>{day}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.calendarDayCircle, isToday && styles.calendarDayToday, isPast && { opacity: 0.25 }]}>
                  <Text style={[styles.calendarDayText, isToday && { color: '#BF789C', fontWeight: '700' }]}>{day}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ExplorarScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('productos');

  // peluquerías
  const [peluquerias, setPeluquerias]       = useState([]);
  const [loadingPelu, setLoadingPelu]       = useState(true);
  const [userLocation, setUserLocation]     = useState(null);
  const [userCity, setUserCity]             = useState(null);
  const [soloMiCiudad, setSoloMiCiudad]     = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Todas');
  const [citasVisible, setCitasVisible]     = useState(false);

  // modal perfil
  const [perfilModal, setPerfilModal] = useState({ visible: false, peluqueria: null });
  const [resenias, setResenias]       = useState([]);

  // modal reserva
  const [reservaModal, setReservaModal]   = useState({ visible: false, peluqueria: null });
  const [reservaFecha, setReservaFecha]   = useState('');
  const [reservaHora, setReservaHora]     = useState('');
  const [reservaNombre, setReservaNombre] = useState('');
  const [guardando, setGuardando]         = useState(false);
  const [reservaExito, setReservaExito]   = useState(false);

  // modal reseña
  const [reseniaModal, setReseniaModal]     = useState(false);
  const [reseniaPuntos, setReseniaPuntos]   = useState(0);
  const [reseniaTexto, setReseniaTexto]     = useState('');
  const [guardandoResenia, setGuardandoResenia] = useState(false);

  useEffect(() => {
    fetchPeluquerias();
    requestLocation();
  }, []);

  const fetchPeluquerias = async () => {
    try {
      const snap = await getDocs(collection(db, 'peluquerias'));
      const data = snap.docs
        .filter(d => !d.data()._info)
        .map(d => ({ id: d.id, ...d.data() }));
      setPeluquerias(data);
    } catch {}
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
    } catch { setResenias([]); }
  };

  const openPerfil = (peluqueria) => {
    setPerfilModal({ visible: true, peluqueria });
    fetchResenias(peluqueria.id);
  };

  const openReserva = (peluqueria) => {
    setPerfilModal({ visible: false, peluqueria: null });
    setReservaFecha('');
    setReservaHora('');
    setReservaNombre(user?.displayName || '');
    setReservaExito(false);
    setReservaModal({ visible: true, peluqueria });
  };

  const confirmarReserva = async () => {
    if (!reservaFecha || !reservaHora || !reservaNombre.trim()) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, 'reservas'), {
        clienteUid: user?.uid || '',
        clienteNombre: reservaNombre.trim(),
        peluqueriaId: reservaModal.peluqueria.id,
        peluqueriaNombre: reservaModal.peluqueria.nombre,
        fecha: reservaFecha,
        hora: reservaHora,
        estado: 'pendiente',
        creadoEn: serverTimestamp(),
      });
      setReservaExito(true);
    } catch {}
    setGuardando(false);
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
    } catch {}
    setGuardandoResenia(false);
  };

  const peluqueriasFiltradas = peluquerias
    .filter(p => selectedFilter === 'Todas' || p.tipo === selectedFilter)
    .filter(p => {
      if (!soloMiCiudad || !userCity) return true;
      return p.ciudad?.toLowerCase() === userCity.toLowerCase();
    })
    .map(p => ({
      ...p,
      distancia: userLocation
        ? haversineKm(userLocation.latitude, userLocation.longitude, p.lat, p.lng)
        : null,
    }))
    .sort((a, b) => {
      if (a.distancia == null) return 1;
      if (b.distancia == null) return -1;
      return a.distancia - b.distancia;
    });

  const nextDays = getNextDays(7);
  const timeSlots = getTimeSlots(reservaModal.peluqueria?.horarios, reservaFecha);

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
        <Text style={styles.headerTitle}>Explorar</Text>

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.peluScroll}>

          {/* botón mis citas */}
          <TouchableOpacity
            style={styles.misCitasBtn}
            onPress={() => setCitasVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-number-outline" size={16} color="#BF789C" />
            <Text style={styles.misCitasBtnText}>Ver mis citas</Text>
            <Ionicons name="chevron-forward" size={14} color="#D6A4A4" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* banner ciudad */}
          {userCity && (
            <View style={styles.cityBanner}>
              <Ionicons name="location" size={14} color="#BF789C" />
              <Text style={styles.cityBannerText} numberOfLines={1}>
                {soloMiCiudad ? userCity : 'Todas las ciudades'}
              </Text>
              <TouchableOpacity
                onPress={() => setSoloMiCiudad(v => !v)}
                activeOpacity={0.75}
                style={styles.cityToggleBtn}
              >
                <Text style={styles.cityToggleText}>
                  {soloMiCiudad ? 'Ver todas' : `Solo ${userCity}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, selectedFilter === f && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* lista */}
          {loadingPelu ? (
            <ActivityIndicator size="large" color="#D6A4A4" style={{ marginTop: 60 }} />
          ) : peluqueriasFiltradas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cut-outline" size={44} color="#EDD0D8" />
              <Text style={styles.emptyText}>No hay peluquerías en esta categoría.</Text>
            </View>
          ) : (
            peluqueriasFiltradas.map(p => (
              <PeluqueriaCard
                key={p.id}
                peluqueria={p}
                distancia={p.distancia}
                onVerPerfil={() => openPerfil(p)}
                onReservar={() => openReserva(p)}
              />
            ))
          )}
        </ScrollView>
      )}

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

                    {/* especialidades */}
                    <View style={styles.especialidadesRow}>
                      {perfilModal.peluqueria.especialidades?.map(e => (
                        <View key={e} style={styles.especialidadChip}>
                          <Text style={styles.especialidadChipText}>{e}</Text>
                        </View>
                      ))}
                    </View>

                    {/* horarios */}
                    <Text style={styles.perfilSectionLabel}>HORARIOS</Text>
                    {Object.entries(perfilModal.peluqueria.horarios || {}).map(([dia, h]) => (
                      <View key={dia} style={styles.horarioRow}>
                        <Text style={styles.horarioDia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Text>
                        <Text style={[styles.horarioHora, !h.activo && { color: '#CCC' }]}>
                          {h.activo ? `${h.abre} – ${h.cierra}` : 'Cerrado'}
                        </Text>
                      </View>
                    ))}

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

                    {/* botón reservar */}
                    <TouchableOpacity
                      style={styles.reservarBtnLarge}
                      onPress={() => openReserva(perfilModal.peluqueria)}
                      activeOpacity={0.85}
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
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Modal reserva ── */}
      <Modal
        visible={reservaModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setReservaModal({ visible: false, peluqueria: null })}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={() => setReservaModal({ visible: false, peluqueria: null })}>
            <View style={styles.reservaOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.reservaCenteredSheet}>
                  {reservaExito ? (
                    <View style={styles.exitoContainer}>
                      <Text style={styles.exitoEmoji}>🎉</Text>
                      <Text style={styles.exitoTitle}>¡Reserva enviada!</Text>
                      <Text style={styles.exitoSub}>
                        {reservaModal.peluqueria?.nombre} recibirá tu solicitud y la confirmará pronto.
                      </Text>
                      <TouchableOpacity
                        style={styles.exitoBtn}
                        onPress={() => setReservaModal({ visible: false, peluqueria: null })}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.reservarBtnGradient}>
                          <Text style={styles.reservarBtnText}>Listo</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      <Text style={styles.reservaTitulo}>Reservar en {reservaModal.peluqueria?.nombre}</Text>

                      {/* nombre */}
                      <Text style={styles.reservaLabel}>Tu nombre</Text>
                      <TextInput
                        style={styles.reservaInput}
                        value={reservaNombre}
                        onChangeText={setReservaNombre}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#CCC"
                      />

                      {/* calendario */}
                      <Text style={styles.reservaLabel}>Fecha</Text>
                      <MiniCalendar
                        selectedDate={reservaFecha}
                        onSelect={(d) => { setReservaFecha(d); setReservaHora(''); }}
                      />

                      {/* hora */}
                      {reservaFecha ? (
                        <>
                          <Text style={styles.reservaLabel}>Hora</Text>
                          {timeSlots.length === 0 ? (
                            <Text style={styles.cerradoText}>Cerrado ese día</Text>
                          ) : (
                            <View style={styles.horasGrid}>
                              {timeSlots.map(slot => (
                                <TouchableOpacity
                                  key={slot}
                                  style={[styles.horaChip, reservaHora === slot && styles.horaChipActive]}
                                  onPress={() => setReservaHora(slot)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={[styles.horaChipText, reservaHora === slot && styles.horaChipTextActive]}>
                                    {slot}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </>
                      ) : null}

                      {/* confirmar */}
                      <TouchableOpacity
                        style={[
                          styles.reservarBtnLarge,
                          { marginTop: 24 },
                          (!reservaFecha || !reservaHora || !reservaNombre.trim()) && { opacity: 0.4 },
                        ]}
                        disabled={!reservaFecha || !reservaHora || !reservaNombre.trim() || guardando}
                        onPress={confirmarReserva}
                        activeOpacity={0.85}
                      >
                        <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.reservarBtnGradient}>
                          {guardando
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.reservarBtnText}>Confirmar reserva</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <CitasModal
        visible={citasVisible}
        onClose={() => setCitasVisible(false)}
        userId={user?.uid}
      />

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
                    <TouchableOpacity key={n} onPress={() => setReseniaPuntos(n)} activeOpacity={0.8}>
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
    </View>
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 14,
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
  cityToggleBtn: {
    backgroundColor: '#FDF0F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cityToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BF789C',
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
});
