import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mybeauty-calendar:notificationsScheduled';

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

export async function scheduleAllNotifications() {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const already = await AsyncStorage.getItem(STORAGE_KEY);
  if (already) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Rutina de mañana — 7:30 AM diario
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌸 Hora de tu rutina de mañana',
      body: 'Empieza el día cuidando tu cabello. ¡Tienes productos esperándote!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 30,
    },
  });

  // Rutina de noche — 9:00 PM diario
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Rutina de noche',
      body: 'Antes de dormir, dale amor a tu cabello. ¡Tu rutina de noche te espera!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });

  // Recordatorio de racha — 8:00 PM diario
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 ¡No pierdas tu racha!',
      body: '¿Ya completaste tu rutina hoy? Mantén tu racha activa.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  // Recordatorio de clima — 8:00 AM diario
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌤️ Revisa el clima de hoy',
      body: 'Abre Tu Diario Capilar y adapta tu rutina según el clima de hoy.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}

export async function cancelStreakNotificationToday() {
  // Marca el día como completado para que no moleste el recordatorio de racha
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem('@mybeauty-calendar:streakDoneToday', today);
}
