import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  const hoy = new Date().toISOString().split('T')[0];
  const esPasada    = cita.fecha < hoy;
  const esCancelada = cita.estado === 'cancelada';
  const esConfirmada = cita.estado === 'confirmada';

  const accentColors = esCancelada ? ['#DDD','#CCC']
    : esConfirmada ? ['#6FCF97','#27AE60']
    : ['#DEB4CC','#BF789C'];

  return (
    <View style={[styles.card, (esPasada || esCancelada) && styles.cardDim]}>
      <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardNombre} numberOfLines={1}>{cita.peluqueriaNombre}</Text>
          {!esPasada && !esCancelada && onCancelar && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onCancelar(cita.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancelar cita"
            >
              <Ionicons name="close" size={13} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardDateRow}>
          <Ionicons name="calendar-outline" size={12} color="#BF789C" />
          <Text style={styles.cardDate}>{formatFecha(cita.fecha)} · {cita.hora}</Text>
        </View>
        <View style={[styles.estadoBadge,
          esConfirmada && styles.estadoConfirmada,
          esCancelada  && styles.estadoCancelada,
        ]}>
          <Text style={[styles.estadoText,
            esConfirmada && { color: '#1B7A42' },
            esCancelada  && { color: '#999' },
          ]}>
            {esCancelada ? 'Cancelada' : esConfirmada ? '✓ Confirmada' : esPasada ? 'Completada' : 'Pendiente'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CitasModal({ visible, onClose, userId }) {
  const insets = useSafeAreaInsets();
  const [citas, setCitas]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCitas = useCallback(async () => {
    if (!userId) return;
    try {
      const snap = await getDocs(query(collection(db, 'reservas'), where('clienteUid', '==', userId)));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.fecha + a.hora) > (b.fecha + b.hora) ? 1 : -1);
      setCitas(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  const onShow = () => { setLoading(true); fetchCitas(); };
  const onRefresh = () => { setRefreshing(true); fetchCitas(); };

  const cancelarCita = async (citaId) => {
    try {
      await updateDoc(doc(db, 'reservas', citaId), { estado: 'cancelada' });
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: 'cancelada' } : c));
    } catch {}
  };

  const hoy = new Date().toISOString().split('T')[0];
  const proximas = citas.filter(c => c.fecha >= hoy && c.estado !== 'cancelada');
  const historial = citas.filter(c => c.fecha < hoy  || c.estado === 'cancelada');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={onShow}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mis Citas</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Ionicons name="close" size={18} color="#BF789C" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#D6A4A4" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D6A4A4" />}
            >
              {citas.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={44} color="#EDD0D8" />
                  <Text style={styles.emptyTitle}>Sin citas agendadas</Text>
                  <Text style={styles.emptySub}>Reserva en una peluquería desde la sección Peluquerías.</Text>
                </View>
              ) : (
                <>
                  {proximas.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>PRÓXIMAS</Text>
                      {proximas.map(c => <CitaCard key={c.id} cita={c} onCancelar={cancelarCita} />)}
                    </>
                  )}
                  {historial.length > 0 && (
                    <>
                      <Text style={[styles.sectionLabel, proximas.length > 0 && { marginTop: 20 }]}>HISTORIAL</Text>
                      {historial.map(c => <CitaCard key={c.id} cita={c} />)}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          )}
          <View style={styles.bottomFade} pointerEvents="none">
            <LinearGradient
              colors={['rgba(253,245,248,0)', '#FDF5F8']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: SCREEN_HEIGHT * 0.12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FDF5F8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D0D8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#F5E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDim: { opacity: 0.6 },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardNombre: {
    fontSize: 14, fontWeight: '800', color: '#2D2D2D', flex: 1,
  },
  cancelBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F5F0F4',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  cardDateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8,
  },
  cardDate: { fontSize: 12, color: '#999', fontWeight: '600' },
  estadoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8EC',
    borderRadius: 99,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  estadoConfirmada: { backgroundColor: '#EDFFF5' },
  estadoCancelada:  { backgroundColor: '#F5F5F5' },
  estadoText: { fontSize: 11, fontWeight: '700', color: '#E5A020' },
  emptyState: {
    alignItems: 'center', paddingVertical: 48, gap: 10,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#D6A4A4' },
  emptySub: {
    fontSize: 13, color: '#BBB', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 32,
  },
});
