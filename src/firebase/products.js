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
  try {
    console.log("🔍 [initProducts] Starting initialization of", ALL_PRODUCTS.length, "products");
    await Promise.all(
      ALL_PRODUCTS.map(({ id, ...data }) => {
        return setDoc(doc(db, COL, id), data, { merge: true }).catch((err) => {
          console.warn(`⚠️  [initProducts] Skipping ${id} (likely permission issue)`, err.code);
        });
      })
    );
    console.log("✅ [initProducts] Initialization complete");
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
  return ALL_PRODUCTS
    .filter(p => p.category === category)
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

export async function fetchProductsByProfile(profileFlags = []) {
  if (profileFlags.length === 0) {
    console.log("🔍 [fetchProductsByProfile] Empty flags, returning all products");
    return fetchAllProducts();
  }

  console.log("🔍 [fetchProductsByProfile] Querying with flags:", profileFlags);

  // Firestore limits array-contains-any to 10 values.
  if (profileFlags.length > 10) {
    console.log("⚠️  [fetchProductsByProfile] >10 flags, using local filter fallback");
    const allProducts = await fetchAllProducts();
    const filtered = allProducts.filter((product) =>
      product.profiles?.some((profile) => profileFlags.includes(profile))
    );
    console.log("🔍 [fetchProductsByProfile] Filtered result:", filtered.length, "products");
    return filtered;
  }

  try {
    const q = query(
      collection(db, COL),
      where('profiles', 'array-contains-any', profileFlags),
    );
    console.log("🔍 [fetchProductsByProfile] Executing Firestore query");
    const snap = await getDocs(q);
    const result = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log("🔍 [fetchProductsByProfile] Query returned:", result.length, "products");
    if (result.length > 0) return result;
  } catch (error) {
    console.warn("⚠️  [fetchProductsByProfile] Firestore unavailable, using local data");
  }

  // Fallback local
  const filtered = ALL_PRODUCTS.filter((product) =>
    product.profiles?.some((profile) => profileFlags.includes(profile))
  );
  console.log("🔍 [fetchProductsByProfile] Local fallback:", filtered.length, "products");
  return filtered;
}

export async function fetchAllProducts() {
  try {
    const snap = await getDocs(collection(db, COL));
    const result = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
    
    if (result.length > 0) {
      console.log("✅ [fetchAllProducts] Loaded", result.length, "products from Firestore");
      return result;
    }
  } catch (error) {
    // Silencioso: fallback esperado
  }

  // Fallback local (default)
  const result = ALL_PRODUCTS.sort((a, b) => a.brand.localeCompare(b.brand));
  console.log("✅ [fetchAllProducts] Using", result.length, "products from local data");
  return result;
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
