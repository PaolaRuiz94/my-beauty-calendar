import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatFecha(fechaStr) {
  const [yr, mo, dy] = fechaStr.split('-').map(Number);
  const d = new Date(yr, mo - 1, dy);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  if (d.getTime() === hoy.getTime()) return 'Hoy';
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  if (d.getTime() === manana.getTime()) return 'Mañana';
  return `${DIAS[d.getDay()]} ${dy} ${MESES[mo - 1]}`;
}

function CitaCard({ cita, onCancelar }) {
  const esPasada = cita.fecha < new Date().toISOString().split('T')[0];
  const esCancelada = cita.estado === 'cancelada';
  const esConfirmada = cita.estado === 'confirmada';

  return (
    <View style={[styles.card, (esPasada || esCancelada) && styles.cardOpaca]}>
      <LinearGradient
        colors={esCancelada ? ['#DDD','#CCC'] : esConfirmada ? ['#6FCF97','#27AE60'] : ['#DEB4CC','#BF789C']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.cardAccent}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardNombre} numberOfLines={1}>{cita.peluqueriaNombre}</Text>
          {!esPasada && !esCancelada && onCancelar && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelar(cita.id)} activeOpacity={0.7}>
              <Ionicons name="close" size={13} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardDateRow}>
          <Ionicons name="calendar-outline" size={13} color="#BF789C" />
          <Text style={styles.cardDate}>{formatFecha(cita.fecha)}</Text>
          <Text style={styles.cardDateSep}>·</Text>
          <Ionicons name="time-outline" size={13} color="#BF789C" />
          <Text style={styles.cardDate}>{cita.hora}</Text>
        </View>

        <View style={[
          styles.estadoBadge,
          esConfirmada && styles.estadoConfirmada,
          esCancelada && styles.estadoCancelada,
          esPasada && !esCancelada && styles.estadoPasada,
        ]}>
          <Text style={[
            styles.estadoText,
            esConfirmada && { color: '#1B7A42' },
            esCancelada && { color: '#999' },
            esPasada && !esCancelada && { color: '#888' },
          ]}>
            {esCancelada ? 'Cancelada' : esConfirmada ? '✓ Confirmada' : esPasada ? 'Completada' : 'Pendiente'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CitasScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [citas, setCitas]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCitas = async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      const snap = await getDocs(
        query(collection(db, 'reservas'), where('clienteUid', '==', user.uid))
      );
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.fecha + a.hora) > (b.fecha + b.hora) ? 1 : -1);
      setCitas(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchCitas(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchCitas(); };

  const cancelarCita = async (citaId) => {
    try {
      await updateDoc(doc(db, 'reservas', citaId), { estado: 'cancelada' });
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: 'cancelada' } : c));
    } catch {}
  };

  const hoy = new Date().toISOString().split('T')[0];
  const proximas = citas.filter(c => c.fecha >= hoy && c.estado !== 'cancelada');
  const pasadas  = citas.filter(c => c.fecha < hoy || c.estado === 'cancelada');

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#DEB4CC', '#BF789C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Text style={styles.headerTitle}>Mis Citas</Text>
        {proximas.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{proximas.length} próxima{proximas.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#D6A4A4" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D6A4A4" />}
        >
          {citas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={52} color="#EDD0D8" />
              <Text style={styles.emptyTitle}>Sin citas aún</Text>
              <Text style={styles.emptySub}>Reserva en una peluquería desde la sección Explorar.</Text>
            </View>
          ) : (
            <>
              {proximas.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>PRÓXIMAS</Text>
                  {proximas.map(c => (
                    <CitaCard key={c.id} cita={c} onCancelar={cancelarCita} />
                  ))}
                </>
              )}

              {pasadas.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: proximas.length > 0 ? 24 : 0 }]}>HISTORIAL</Text>
                  {pasadas.map(c => (
                    <CitaCard key={c.id} cita={c} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5F8' },

  header: {
    paddingBottom: 20,
    paddingHorizontal: 22,
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  scroll: {
    padding: 18,
    paddingBottom: 48,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  cardOpaca: { opacity: 0.65 },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D2D2D',
    flex: 1,
  },
  cancelBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  cardDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  cardDateSep: {
    color: '#CCC',
    fontSize: 13,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8EC',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estadoConfirmada: { backgroundColor: '#EDFFF5' },
  estadoCancelada:  { backgroundColor: '#F5F5F5' },
  estadoPasada:     { backgroundColor: '#F5F5F5' },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A020',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#D6A4A4',
  },
  emptySub: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 32,
  },
});
