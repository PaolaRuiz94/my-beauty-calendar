import {
  collection, doc, updateDoc, addDoc,
  serverTimestamp, query, orderBy, onSnapshot,
  arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from './config';

export function subscribeToPosts(callback) {
  const q = query(collection(db, 'Post'), orderBy('creadoEn', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToComments(postId, callback) {
  const q = query(
    collection(db, 'Post', postId, 'comments'),
    orderBy('creadoEn', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function toggleLike(postId, userEmail, alreadyLiked) {
  const ref = doc(db, 'Post', postId);
  await updateDoc(ref, {
    likesUsuarios: alreadyLiked
      ? arrayRemove(userEmail)
      : arrayUnion(userEmail),
  });
}

export async function addUserPost(text, userName) {
  await addDoc(collection(db, 'Post'), {
    tipo: 'pregunta',
    texto: text.trim(),
    autor: userName,
    inicial: userName.charAt(0).toUpperCase(),
    likesUsuarios: [],
    commentsCount: 0,
    creadoEn: serverTimestamp(),
  });
}

export async function addComment(postId, text, userName) {
  await addDoc(collection(db, 'Post', postId, 'comments'), {
    texto: text.trim(),
    autor: userName,
    inicial: userName.charAt(0).toUpperCase(),
    creadoEn: serverTimestamp(),
  });
  await updateDoc(doc(db, 'Post', postId), {
    commentsCount: increment(1),
  });
}
