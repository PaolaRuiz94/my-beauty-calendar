import {
  collection, setDoc, doc, getDocs, query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { productsSeed } from '../data/productsSeed';
import { productsSeedV2 } from '../data/productsSeedV2';
import { productsSeedV3 } from '../data/productsSeedV3';
import { productsSeedV4 } from '../data/productsSeedV4';
import { productsSeedV5 } from '../data/productsSeedV5';
import { PRODUCTS } from '../data/products';

// Lookup por ID con ASINs actualizados de products.js
const catalogById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

// Seed files tienen descriptions/profiles; products.js tiene ASINs correctos
const ALL_PRODUCTS = [...productsSeed, ...productsSeedV2, ...productsSeedV3, ...productsSeedV4, ...productsSeedV5].map(p => {
  const catalog = catalogById[p.id];
  if (!catalog) return p;
  if (catalog.image) console.log('MERGE IMAGE:', p.id, catalog.image.slice(0, 50));
  return { ...p, asin: catalog.asin, amazonLink: catalog.amazonLink, ...(catalog.image ? { image: catalog.image } : {}) };
});

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
  if (profileFlags.length === 0) return fetchAllProducts();

  const filtered = ALL_PRODUCTS.filter((product) =>
    product.profiles?.some((profile) => profileFlags.includes(profile))
  );
  return filtered;
}

export async function fetchAllProducts() {
  const result = [...ALL_PRODUCTS].sort((a, b) => a.brand.localeCompare(b.brand));
  const withImage = result.filter(p => p.image);
  console.log("✅ [fetchAllProducts]", result.length, "products,", withImage.length, "with image field");
  withImage.slice(0, 3).forEach(p => console.log('  IMG:', p.id, p.image?.slice(0, 40)));
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
