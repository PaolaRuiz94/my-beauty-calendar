import {
  collection, setDoc, doc, getDocs, query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { productsSeed } from '../data/productsSeed';
import { productsSeedV2 } from '../data/productsSeedV2';
import { productsSeedV3 } from '../data/productsSeedV3';
import { productsSeedV4 } from '../data/productsSeedV4';

const ALL_PRODUCTS = [...productsSeed, ...productsSeedV2, ...productsSeedV3, ...productsSeedV4];

const COL = 'products';

// ── Seed (ejecutar una sola vez) ──────────────────────────────────────────────

export async function initProducts() {
  const snap = await getDocs(collection(db, COL));
  const existingIds = new Set(snap.docs.map(d => d.id));
  const missing = ALL_PRODUCTS.filter(p => !existingIds.has(p.id));
  if (missing.length === 0) return;

  await Promise.all(missing.map(({ id, ...data }) => setDoc(doc(db, COL, id), data)));
  console.log(`✅ ${missing.length} productos nuevos cargados en Firestore`);
}

// ── Consultas ─────────────────────────────────────────────────────────────────

export async function fetchProductsByCategory(category) {
  const q = query(
    collection(db, COL),
    where('category', '==', category)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

export async function fetchProductsByProfile(profileFlags = []) {
  if (profileFlags.length === 0) return fetchAllProducts();
  const flags = profileFlags.slice(0, 30);
  const q = query(
    collection(db, COL),
    where('profiles', 'array-contains-any', flags),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllProducts() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

// Búsqueda local sobre los productos ya cargados (sin índice extra en Firestore)
export function filterProducts(products = [], searchQuery = '') {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

// Agrupa productos por categoría
export function groupByCategory(products = []) {
  return products.reduce((acc, p) => {
    const key = p.category || 'Otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}
