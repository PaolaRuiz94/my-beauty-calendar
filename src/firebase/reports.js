import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Solo escritura desde la app — la revisión es manual en la consola de Firebase.
export async function reportContent({ targetType, postId, commentId, reason, reporterId }) {
  await addDoc(collection(db, 'reports'), {
    targetType,
    postId,
    commentId: commentId || null,
    reason,
    reporterId,
    creadoEn: serverTimestamp(),
  });
}
