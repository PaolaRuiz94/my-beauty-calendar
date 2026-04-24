import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

// Trae todos los videos de la colección "routine_videos"
// Estructura esperada en Firestore:
// routine_videos/
//   shampoo      → { label, uri, descripcion }
//   acondicionador → { label, uri, descripcion }
//   tratamiento  → { label, uri, descripcion }
//   ...

export async function fetchRoutineVideos() {
  const snapshot = await getDocs(collection(db, 'routine_videos'));
  const videos = {};
  snapshot.forEach((doc) => {
    videos[doc.id] = doc.data();
  });
  return videos;
}
