import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../auth/AuthContext';
import { fetchServicios, fetchOccupiedTimes, createReservation } from '../firebase/reservations';
import { dayKeyFor, normalizeHorarioDay, availableStartTimes } from '../utils/scheduling';
import { scheduleAppointmentReminder } from '../services/notificationService';

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // lunes a domingo

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const offset = startDow === 0 ? 6 : startDow - 1; // semana empieza en lunes
  const days = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push({ dateStr: `${year}-${mm}-${dd}`, number: d });
  }
  return days;
}

function MonthCalendar({ selectedFecha, onSelectFecha }) {
  const hoy = todayStr();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prevMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const days = getMonthGrid(viewYear, viewMonth);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarNav}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={isCurrentMonth}
          style={styles.calendarNavBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
        >
          <Ionicons name="chevron-back" size={20} color={isCurrentMonth ? '#E5D5DC' : '#BF789C'} />
        </TouchableOpacity>
        <Text style={styles.calendarNavTitle}>
          {MESES_LARGO[viewMonth].charAt(0).toUpperCase() + MESES_LARGO[viewMonth].slice(1)} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.calendarNavBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
        >
          <Ionicons name="chevron-forward" size={20} color="#BF789C" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarDowRow}>
        {DIAS_SEMANA.map((l, i) => (
          <Text key={i} style={styles.calendarDowText}>{l}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.calendarCell} />;
          const isPast = day.dateStr < hoy;
          const isSelected = day.dateStr === selectedFecha;
          const isToday = day.dateStr === hoy;
          return (
            <TouchableOpacity
              key={day.dateStr}
              style={styles.calendarCell}
              disabled={isPast}
              onPress={() => onSelectFecha(day.dateStr)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${day.number} de ${MESES_LARGO[viewMonth]}`}
              accessibilityState={{ selected: isSelected, disabled: isPast }}
            >
              <View style={[
                styles.calendarDayCircle,
                isSelected && styles.calendarDayCircleSelected,
                isToday && !isSelected && styles.calendarDayCircleToday,
              ]}>
                <Text style={[
                  styles.calendarDayNum,
                  isPast && styles.calendarDayNumPast,
                  isSelected && styles.calendarDayNumSelected,
                  isToday && !isSelected && styles.calendarDayNumToday,
                ]}>
                  {day.number}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ReservarCitaScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { storeId, storeName, horarios } = route?.params || {};

  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [selectedServicio, setSelectedServicio] = useState(null);

  const [selectedFecha, setSelectedFecha] = useState(null);

  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [selectedHora, setSelectedHora] = useState(null);

  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchServicios(storeId)
      .then(setServicios)
      .catch(() => setServicios([]))
      .finally(() => setLoadingServicios(false));
  }, [storeId]);

  const loadHorarios = useCallback(async () => {
    if (!selectedServicio || !selectedFecha) { setHorariosDisponibles([]); return; }
    setLoadingHorarios(true);
    setSelectedHora(null);
    try {
      const rangos = normalizeHorarioDay(horarios?.[dayKeyFor(selectedFecha)]);
      const occupied = await fetchOccupiedTimes(storeId, selectedFecha);
      // Si la fecha elegida es hoy, no ofrecer horarios que ya pasaron.
      const now = new Date();
      const minStartMinutes = selectedFecha === todayStr() ? now.getHours() * 60 + now.getMinutes() : null;
      setHorariosDisponibles(availableStartTimes(rangos, selectedServicio.duracionMinutos, occupied, minStartMinutes));
    } catch {
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  }, [storeId, horarios, selectedServicio, selectedFecha]);

  useEffect(() => { loadHorarios(); }, [loadHorarios]);

  const handleConfirmar = async () => {
    if (!user?.uid || !selectedServicio || !selectedFecha || !selectedHora) return;
    setConfirming(true);
    try {
      const reservaId = await createReservation({
        storeId,
        storeName,
        servicio: selectedServicio,
        fecha: selectedFecha,
        horaInicio: selectedHora,
        clienteUid: user.uid,
      });
      scheduleAppointmentReminder({
        reservaId,
        storeName,
        servicioNombre: selectedServicio.nombre,
        fecha: selectedFecha,
        hora: selectedHora,
      }).catch(() => {});
      Alert.alert('¡Listo!', 'Tu cita quedó reservada.', [
        { text: 'Ver mis citas', onPress: () => navigation.replace('MisCitas') },
        { text: 'Cerrar', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      if (err?.code === 'SLOT_TAKEN') {
        Alert.alert('Ese horario ya no está libre', 'Alguien más lo tomó justo ahora. Elegí otro horario.');
        loadHorarios();
      } else {
        Alert.alert('Error', 'No se pudo reservar la cita. Intenta de nuevo.');
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Reservar en {storeName}</Text>
          <View style={styles.headerBtn} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>SERVICIO</Text>
        {loadingServicios ? (
          <ActivityIndicator size="small" color="#D6A4A4" style={{ marginVertical: 16 }} />
        ) : servicios.length === 0 ? (
          <Text style={styles.emptyText}>Esta tienda todavía no cargó servicios agendables.</Text>
        ) : (
          <View style={styles.chipWrap}>
            {servicios.map((s) => {
              const active = selectedServicio?.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedServicio(s)}
                  style={[styles.servicioCard, active && styles.servicioCardActive]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={s.nombre}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.servicioNombre, active && styles.servicioNombreActive]}>{s.nombre}</Text>
                  <Text style={[styles.servicioMeta, active && styles.servicioMetaActive]}>
                    {s.duracionMinutos} min{typeof s.precio === 'number' ? ` · $${s.precio.toLocaleString('es-CO')} COP` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedServicio && (
          <>
            <Text style={styles.sectionLabel}>FECHA</Text>
            <MonthCalendar selectedFecha={selectedFecha} onSelectFecha={setSelectedFecha} />
          </>
        )}

        {selectedServicio && selectedFecha && (
          <>
            <Text style={styles.sectionLabel}>HORARIO</Text>
            {loadingHorarios ? (
              <ActivityIndicator size="small" color="#D6A4A4" style={{ marginVertical: 16 }} />
            ) : horariosDisponibles.length === 0 ? (
              <Text style={styles.emptyText}>No hay horarios libres ese día para este servicio.</Text>
            ) : (
              <View style={styles.chipWrap}>
                {horariosDisponibles.map((hora) => {
                  const active = selectedHora === hora;
                  return (
                    <TouchableOpacity
                      key={hora}
                      onPress={() => setSelectedHora(hora)}
                      style={[styles.horaChip, active && styles.horaChipActive]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Reservar a las ${hora}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.horaChipText, active && styles.horaChipTextActive]}>{hora}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleConfirmar}
          activeOpacity={0.88}
          disabled={!selectedServicio || !selectedFecha || !selectedHora || confirming}
          style={styles.confirmBtn}
        >
          <LinearGradient
            colors={(!selectedServicio || !selectedFecha || !selectedHora) ? ['#E2C8D4', '#CCB0C0'] : ['#D6A4A4', '#BF789C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Confirmar reserva</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5F8' },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 8 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#D6A4A4',
    letterSpacing: 1.2, marginTop: 20, marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: '#BBB' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  servicioCard: {
    borderWidth: 1.5, borderColor: '#F0DDE2', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', minWidth: '47%',
  },
  servicioCardActive: { backgroundColor: '#BF789C', borderColor: '#BF789C' },
  servicioNombre: { fontSize: 14, fontWeight: '700', color: '#2D2D2D' },
  servicioNombreActive: { color: '#fff' },
  servicioMeta: { fontSize: 12, color: '#999', marginTop: 4 },
  servicioMetaActive: { color: 'rgba(255,255,255,0.85)' },

  calendarCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: '#F0DDE2',
  },
  calendarNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  calendarNavTitle: { fontSize: 14, fontWeight: '800', color: '#2D2D2D', textTransform: 'capitalize' },
  calendarDowRow: { flexDirection: 'row', marginBottom: 4 },
  calendarDowText: {
    width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#D6A4A4',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarDayCircle: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  calendarDayCircleSelected: { backgroundColor: '#BF789C' },
  calendarDayCircleToday: { borderWidth: 1.5, borderColor: '#BF789C' },
  calendarDayNum: { fontSize: 13, fontWeight: '600', color: '#2D2D2D' },
  calendarDayNumPast: { color: '#DDD' },
  calendarDayNumSelected: { color: '#fff', fontWeight: '800' },
  calendarDayNumToday: { color: '#BF789C', fontWeight: '800' },

  horaChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 99,
    borderWidth: 1.5, borderColor: '#F0DDE2', backgroundColor: '#fff',
  },
  horaChipActive: { backgroundColor: '#BF789C', borderColor: '#BF789C' },
  horaChipText: { fontSize: 13, fontWeight: '700', color: '#2D2D2D' },
  horaChipTextActive: { color: '#fff' },

  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F0E0E8', backgroundColor: '#FDF5F8',
  },
  confirmBtn: { borderRadius: 16, overflow: 'hidden' },
  confirmGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
