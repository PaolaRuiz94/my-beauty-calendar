// scheduling.js — cálculo de horarios disponibles y slots de una cita.
// Grilla fija de 15 minutos (acordado con el panel de empresas, no es
// configurable por tienda/servicio).

export const SLOT_MINUTES = 15;

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// fecha: 'YYYY-MM-DD' -> clave de día en minúscula sin tilde ('lunes', ...)
export function dayKeyFor(fecha) {
  const d = new Date(`${fecha}T12:00:00`);
  return DAY_KEYS[d.getDay()];
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Cuántos slots de 15 min ocupa un servicio, redondeando hacia arriba
// (ej. 20 min -> 2 slots = 30 min).
export function slotsForDuration(duracionMinutos) {
  return Math.max(1, Math.ceil((duracionMinutos || SLOT_MINUTES) / SLOT_MINUTES));
}

// IDs de slot que ocuparía una cita que arranca en horaInicio ('HH:MM') —
// mismo formato que espera el panel de empresas: `{fecha}_{horaSlot}`.
export function slotIdsFor(fecha, horaInicio, duracionMinutos) {
  const count = slotsForDuration(duracionMinutos);
  const startMin = toMinutes(horaInicio);
  return Array.from({ length: count }, (_, i) => `${fecha}_${toHHMM(startMin + i * SLOT_MINUTES)}`);
}

// Normaliza el campo horarios[dia] a un array de rangos {inicio, fin},
// soportando el formato viejo curado a mano ({activo, abre, cierra}) y el
// nuevo del panel de empresas ([{inicio, fin}] | null).
export function normalizeHorarioDay(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object' && value.activo) {
    return [{ inicio: value.abre, fin: value.cierra }];
  }
  return [];
}

// Todos los horarios de inicio posibles para un servicio ese día, dados los
// rangos de atención (ya normalizados) y las horas ya ocupadas (Set de 'HH:MM').
export function availableStartTimes(rangos, duracionMinutos, occupiedTimes) {
  if (!Array.isArray(rangos) || rangos.length === 0) return [];
  const count = slotsForDuration(duracionMinutos);
  const occupied = occupiedTimes || new Set();
  const starts = [];

  rangos.forEach(({ inicio, fin }) => {
    if (!inicio || !fin) return;
    const startMin = toMinutes(inicio);
    const endMin = toMinutes(fin);
    for (let t = startMin; t + count * SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
      const wouldOccupy = Array.from({ length: count }, (_, i) => toHHMM(t + i * SLOT_MINUTES));
      if (wouldOccupy.every((hhmm) => !occupied.has(hhmm))) starts.push(toHHMM(t));
    }
  });

  return starts;
}
