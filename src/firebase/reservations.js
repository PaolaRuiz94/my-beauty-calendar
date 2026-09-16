import {
  collection, getDocs, query, where, doc, runTransaction, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { slotIdsFor } from '../utils/scheduling';

export async function fetchServicios(storeId) {
  const snap = await getDocs(collection(db, 'peluquerias', storeId, 'servicios'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.active !== false);
}

// Horas ya ocupadas ese día en esa tienda (solo la parte 'HH:MM').
export async function fetchOccupiedTimes(storeId, fecha) {
  const snap = await getDocs(
    query(collection(db, 'peluquerias', storeId, 'slots'), where('fecha', '==', fecha))
  );
  return new Set(snap.docs.map((d) => d.data().hora));
}

// Reserva atómica: crea los slots + la reserva en una sola transacción. Si
// algún slot que necesita el servicio ya está tomado (otra clienta se
// adelantó), aborta sin crear nada y lanza SLOT_TAKEN.
export async function createReservation({ storeId, storeName, servicio, fecha, horaInicio, clienteUid }) {
  const slotIds = slotIdsFor(fecha, horaInicio, servicio.duracionMinutos);
  const reservaRef = doc(collection(db, 'reservas'));

  await runTransaction(db, async (tx) => {
    // Todas las lecturas de una transacción van antes que cualquier escritura.
    const slotRefs = slotIds.map((id) => doc(db, 'peluquerias', storeId, 'slots', id));
    const slotSnaps = await Promise.all(slotRefs.map((ref) => tx.get(ref)));
    if (slotSnaps.some((snap) => snap.exists())) {
      const err = new Error('Ese horario ya no está disponible.');
      err.code = 'SLOT_TAKEN';
      throw err;
    }

    slotRefs.forEach((ref) => {
      tx.set(ref, {
        fecha,
        hora: ref.id.split('_')[1],
        clienteUid,
        reservaId: reservaRef.id,
        createdAt: serverTimestamp(),
      });
    });

    tx.set(reservaRef, {
      storeId,
      peluqueriaNombre: storeName,
      servicioId: servicio.id,
      servicioNombre: servicio.nombre,
      duracionMinutos: servicio.duracionMinutos,
      fecha,
      hora: horaInicio,
      estado: 'pendiente',
      clienteUid,
      slotIds,
      createdAt: serverTimestamp(),
    });
  });

  return reservaRef.id;
}

// Cancela y libera los slots que ocupaba, en un solo batch atómico. Las
// reservas viejas (sin storeId/slotIds, de antes de este esquema) solo
// cambian de estado — no tienen slots que liberar.
export async function cancelReservation(reservaId, storeId, slotIds = []) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reservas', reservaId), { estado: 'cancelada' });
  if (storeId && slotIds.length > 0) {
    slotIds.forEach((id) => batch.delete(doc(db, 'peluquerias', storeId, 'slots', id)));
  }
  await batch.commit();
}
