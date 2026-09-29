import { MONTH_NAMES_SHORT } from '../data/calendarContent';

export function getCategoryForStep(stepText) {
  const t = stepText.toLowerCase();
  if (t.includes('shampoo'))                                                              return 'Shampoo';
  if (t.includes('acondicionador'))                                                       return 'Acondicionador';
  if (t.includes('mascarilla') || t.includes('proteico') || t.includes('tratamiento'))   return 'Tratamiento';
  if (t.includes('aceite'))                                                               return 'Aceites';
  if (t.includes('crema') || t.includes('leave-in') || t.includes('loc') || t.includes('lco')) return 'Crema de Peinar';
  if (t.includes('gel'))                                                                  return 'Gel';
  if (t.includes('mousse') || t.includes('espuma'))                                      return 'Espumas';
  return null;
}

export function buildRoutineStep(s, products) {
  const text = typeof s === 'string' ? s : s.text;
  const category = typeof s === 'object' && s.category ? s.category : getCategoryForStep(text);
  const displayLabel = typeof s === 'object' ? s.displayLabel : undefined;
  const product = (typeof s === 'object' && s.product)
    ? s.product
    : (category ? (products.find(p => p.category === category) ?? null) : null);
  return { text, editable: false, category, product, displayLabel };
}

// El ciclo se reinicia en el día 0 de cada bloque de 14 días para mantener el
// "Lavado A" alineado, incluso si el usuario nunca abre la app justo ese día.
export function cycleIndexFor(i, planLength) {
  return i % 14 === 0 ? 0 : i % planLength;
}

// Arma los pasos de UNA fecha a partir de un índice específico del ciclo de 7 días.
// Usado por "cambiar de lavado" y "restablecer rutina".
export function buildDayFromCycleIndex(plan, cycleIdx, products) {
  const dayPlan = plan[cycleIdx] || plan[0];
  return {
    day: (dayPlan.daySteps || []).map(s => buildRoutineStep(s, products)),
    night: (dayPlan.nightSteps || []).map(s => buildRoutineStep(s, products)),
  };
}

export function expandPlanTo30Days(plan, products) {
  const today = new Date();
  const newDay = {};
  const newNight = {};
  const newCycleIndex = {};
  const buildStep = (s) => buildRoutineStep(s, products);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const cycleIdx = cycleIndexFor(i, plan.length);
    const dayPlan = plan[cycleIdx];
    newCycleIndex[dateStr] = cycleIdx;
    newDay[dateStr] = (dayPlan.daySteps || []).map(buildStep);
    newNight[dateStr] = (dayPlan.nightSteps || []).map(buildStep);
  }
  return { newDay, newNight, newCycleIndex };
}

export function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} de ${MONTH_NAMES_SHORT[parseInt(m) - 1]}`;
}

export function buildMarkedDates(dayByDate, nightByDate) {
  const out = {};
  const allDates = new Set([...Object.keys(dayByDate), ...Object.keys(nightByDate)]);
  allDates.forEach(d => {
    if (dayByDate[d]?.length || nightByDate[d]?.length) out[d] = true;
  });
  return out;
}

export function buildCompletedDates(dayDone, nightDone) {
  const out = {};
  const allDates = new Set([...Object.keys(dayDone), ...Object.keys(nightDone)]);
  allDates.forEach(d => {
    if (dayDone[d]?.length > 0 || nightDone[d]?.length > 0) out[d] = true;
  });
  return out;
}

export function calcStreak(dayDone, nightDone, skippedDates) {
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  const todayActive = (dayDone[today]?.length > 0) || (nightDone[today]?.length > 0) || skippedDates[today];
  if (todayActive) streak++;
  const base = new Date();
  for (let i = 1; i < 365; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const active = (dayDone[dateStr]?.length > 0) || (nightDone[dateStr]?.length > 0) || skippedDates[dateStr];
    if (active) streak++;
    else break;
  }
  return streak;
}
