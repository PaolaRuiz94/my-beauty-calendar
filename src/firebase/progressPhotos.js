import { db, storage } from './config';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function addProgressPhoto(userId, uri) {
  const timestamp = Date.now();
  const storagePath = `progress_photos/${userId}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);
  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, 'users', userId, 'progressPhotos'), {
    url,
    storagePath,
    date: new Date().toISOString().split('T')[0],
    createdAt: timestamp,
  });
}

export function subscribeToProgressPhotos(userId, callback) {
  const q = query(
    collection(db, 'users', userId, 'progressPhotos'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function deleteProgressPhoto(userId, photoId, storagePath) {
  await deleteDoc(doc(db, 'users', userId, 'progressPhotos', photoId));
  try { await deleteObject(ref(storage, storagePath)); } catch {}
}
