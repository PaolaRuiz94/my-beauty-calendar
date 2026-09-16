import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../auth/AuthContext';
import { fetchServicios, fetchOccupiedTimes, createReservation } from '../firebase/reservations';
import { dayKeyFor, normalizeHorarioDay, availableStartTimes } from '../utils/scheduling';

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function nextDays(count) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      fecha: d.toISOString().split('T')[0],
      diaLabel: DIAS_CORTO[d.getDay()],
      numero: d.getDate(),
      mesLabel: MESES_CORTO[d.getMonth()],
    };
  });
}

export default function ReservarCitaScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { storeId, storeName, horarios } = route?.params || {};

  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [selectedServicio, setSelectedServicio] = useState(null);

  const dias = useMemo(() => nextDays(14), []);
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
      setHorariosDisponibles(availableStartTimes(rangos, selectedServicio.duracionMinutos, occupied));
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
      await createReservation({
        storeId,
        storeName,
        servicio: selectedServicio,
        fecha: selectedFecha,
        horaInicio: selectedHora,
        clienteUid: user.uid,
      });
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasRow}>
              {dias.map((d) => {
                const active = selectedFecha === d.fecha;
                return (
                  <TouchableOpacity
                    key={d.fecha}
                    onPress={() => setSelectedFecha(d.fecha)}
                    style={[styles.diaChip, active && styles.diaChipActive]}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.diaLabel} ${d.numero} de ${d.mesLabel}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.diaChipDia, active && styles.diaChipTextActive]}>{d.diaLabel}</Text>
                    <Text style={[styles.diaChipNumero, active && styles.diaChipTextActive]}>{d.numero}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

  diasRow: { gap: 10, paddingRight: 20 },
  diaChip: {
    width: 52, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#F0DDE2', backgroundColor: '#fff',
  },
  diaChipActive: { backgroundColor: '#BF789C', borderColor: '#BF789C' },
  diaChipDia: { fontSize: 11, fontWeight: '600', color: '#999' },
  diaChipNumero: { fontSize: 16, fontWeight: '800', color: '#2D2D2D', marginTop: 2 },
  diaChipTextActive: { color: '#fff' },

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
