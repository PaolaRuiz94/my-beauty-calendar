import {
  collection, doc, updateDoc, addDoc, deleteDoc,
  serverTimestamp, query, orderBy, onSnapshot,
  arrayUnion, arrayRemove, increment,
  limit, startAfter, getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

const PAGE_SIZE = 15;

// Página en vivo (las más recientes). Para más antiguas, ver fetchMorePosts.
export function subscribeToPosts(callback) {
  const q = query(collection(db, 'Post'), orderBy('creadoEn', 'desc'), limit(PAGE_SIZE));
  return onSnapshot(q, (snap) => {
    const lastDoc = snap.docs[snap.docs.length - 1] || null;
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })), lastDoc, snap.docs.length === PAGE_SIZE);
  });
}

// Página siguiente a partir de un doc de referencia (no es en vivo).
export async function fetchMorePosts(afterDoc) {
  const q = query(
    collection(db, 'Post'),
    orderBy('creadoEn', 'desc'),
    startAfter(afterDoc),
    limit(PAGE_SIZE)
  );
  const snap = await getDocs(q);
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
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

export async function toggleLike(postId, userId, alreadyLiked) {
  const ref = doc(db, 'Post', postId);
  await updateDoc(ref, {
    likesUsuarios: alreadyLiked
      ? arrayRemove(userId)
      : arrayUnion(userId),
  });
}

export async function uploadPostImage(userId, uri) {
  const timestamp = Date.now();
  const storagePath = `forum_posts/${userId}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);
  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function addUserPost(text, userName, userId, imageUrl) {
  const name = userName?.trim() || 'Usuaria';
  await addDoc(collection(db, 'Post'), {
    tipo: 'pregunta',
    texto: text.trim(),
    autor: name,
    autorId: userId,
    inicial: name.charAt(0).toUpperCase(),
    ...(imageUrl ? { imagen: imageUrl } : {}),
    likesUsuarios: [],
    commentsCount: 0,
    creadoEn: serverTimestamp(),
  });
}

export async function addComment(postId, text, userName, userId) {
  const name = userName?.trim() || 'Usuaria';
  await addDoc(collection(db, 'Post', postId, 'comments'), {
    texto: text.trim(),
    autor: name,
    autorId: userId,
    inicial: name.charAt(0).toUpperCase(),
    creadoEn: serverTimestamp(),
  });
  await updateDoc(doc(db, 'Post', postId), {
    commentsCount: increment(1),
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'Post', postId));
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, 'Post', postId, 'comments', commentId));
  await updateDoc(doc(db, 'Post', postId), {
    commentsCount: increment(-1),
  });
}
