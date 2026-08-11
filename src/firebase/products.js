import {
  collection, setDoc, doc, getDocs, query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { PRODUCTS } from '../data/products';
import { getMatchingProductsByFlags } from '../utils/productScoring';

const COL = 'products';

// ── Seed (ejecutar una sola vez) ──────────────────────────────────────────────

export async function initProducts() {
  try {
    await Promise.all(
      PRODUCTS.map(({ id, ...data }) => {
        return setDoc(doc(db, COL, id), data, { merge: true }).catch((err) => {
          console.warn(`⚠️  [initProducts] Skipping ${id} (likely permission issue)`, err.code);
        });
      })
    );
  } catch (error) {
    console.warn("⚠️  [initProducts] Warning:", error.code);
  }
}

// ── Consultas ─────────────────────────────────────────────────────────────────

export async function fetchProductsByCategory(category) {
  try {
    const q = query(
      collection(db, COL),
      where('category', '==', category)
    );
    const snap = await getDocs(q);
    const result = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
    if (result.length > 0) return result;
  } catch (error) {
    console.warn("⚠️  [fetchProductsByCategory] Firestore unavailable, using local data");
  }
  // Fallback local
  return PRODUCTS
    .filter(p => p.category === category)
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

export async function fetchProductsByProfile(profileFlags = []) {
  if (profileFlags.length === 0) return fetchAllProducts();

  const filtered = getMatchingProductsByFlags(PRODUCTS, profileFlags);
  return filtered.length > 0 ? filtered : fetchAllProducts();
}

export async function fetchAllProducts() {
  return [...PRODUCTS].sort((a, b) => a.brand.localeCompare(b.brand));
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
