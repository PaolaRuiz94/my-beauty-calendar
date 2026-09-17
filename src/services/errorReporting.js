import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// Reporta errores a Firestore (colección error_logs), visible desde la
// consola de Firebase. Se eligió esto en vez de un servicio externo tipo
// Sentry porque no requiere módulos nativos ni cuenta aparte — funciona
// igual en Expo Go, reusando la infraestructura que ya existe.
export async function logError(error, context) {
  try {
    await addDoc(collection(db, 'error_logs'), {
      message: error?.message || String(error),
      stack: (error?.stack || '').slice(0, 2000),
      context: context || null,
      userId: auth.currentUser?.uid || null,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version || null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Si ni siquiera se puede reportar el error (sin red, sin permisos),
    // no hay nada más que hacer — nunca debe volver a tirar desde acá.
  }
}

// Se registra como efecto de módulo (igual que notificationService.js con
// setNotificationHandler) para capturar excepciones de JS que no pasan por
// el árbol de React — y por lo tanto no llegan a ningún ErrorBoundary.
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logError(error, isFatal ? 'uncaught-fatal' : 'uncaught');
    defaultHandler(error, isFatal);
  });
}
