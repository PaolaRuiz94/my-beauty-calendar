import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function truncate(text, max = 80) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

// El efecto que llama a syncRoutineNotifications puede dispararse varias veces
// seguidas (varios useState que cambian casi al mismo tiempo al cargar la pantalla).
// Como cada llamada cancela todo y reprograma, dos llamadas en paralelo pueden
// pisarse y dejar notificaciones duplicadas. Esta cola serializa las llamadas
// para que nunca corran dos al mismo tiempo.
let syncChain = Promise.resolve();

export function syncRoutineNotifications(args) {
  syncChain = syncChain.then(() => doSyncRoutineNotifications(args)).catch(() => {});
  return syncChain;
}

// Reprograma las notificaciones de rutina según el estado actual del calendario.
// Se debe llamar cada vez que cambian dayByDate/nightByDate/skippedDates/dayDone/nightDone,
// para que el contenido y el recordatorio de racha reflejen la rutina real del día.
async function doSyncRoutineNotifications({
  dayByDate = {},
  nightByDate = {},
  skippedDates = {},
  dayDone = {},
  nightDone = {},
  cycleTitleByDate = {},
} = {}) {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const scheduleFor = async (dateStr, hour, minute, title, body) => {
    const target = new Date(dateStr + 'T00:00:00');
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= Date.now()) return; // ya pasó esa hora, no tiene sentido programarla
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  };

  if (!skippedDates[today]) {
    const daySteps = dayByDate[today] || [];
    if (daySteps.length > 0) {
      const label = cycleTitleByDate[today];
      const body = label ? `Hoy toca: ${label}` : (truncate(daySteps[0]?.text) || 'Tu rutina de día te espera');
      await scheduleFor(today, 7, 30, '🌸 Hora de tu rutina de mañana', body);
    }

    const nightSteps = nightByDate[today] || [];
    if (nightSteps.length > 0) {
      const body = truncate(nightSteps[0]?.text) || 'Tu rutina de noche te espera';
      await scheduleFor(today, 21, 0, '🌙 Rutina de noche', body);
    }
  }

  // Recordatorio de racha — solo si de verdad falta completar algo
  const todayDaySteps = dayByDate[today] || [];
  const todayNightSteps = nightByDate[today] || [];
  const hasStepsToday = todayDaySteps.length > 0 || todayNightSteps.length > 0;
  const dayDoneToday = todayDaySteps.length > 0 && (dayDone[today] || []).length >= todayDaySteps.length;
  const nightDoneToday = todayNightSteps.length > 0 && (nightDone[today] || []).length >= todayNightSteps.length;
  const allDoneToday = (todayDaySteps.length === 0 || dayDoneToday) && (todayNightSteps.length === 0 || nightDoneToday);

  if (hasStepsToday && !allDoneToday && !skippedDates[today]) {
    await scheduleFor(today, 20, 0, '🔥 ¡No pierdas tu racha!', '¿Ya completaste tu rutina hoy? Mantén tu racha activa.');
  }

  // Clima — recordatorio genérico
  await scheduleFor(today, 8, 0, '🌤️ Revisa el clima de hoy', 'Abre Tu Diario Capilar y adapta tu rutina según el clima de hoy.');
}
