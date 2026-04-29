import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function saveDiaryEntry(userId, date, data) {
  await setDoc(
    doc(db, 'users', userId, 'diary', date),
    { ...data, date, updatedAt: Date.now() },
    { merge: true },
  );
}

export async function getDiaryEntry(userId, date) {
  const snap = await getDoc(doc(db, 'users', userId, 'diary', date));
  return snap.exists() ? snap.data() : null;
}
