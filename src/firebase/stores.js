import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { CATEGORY_KEY } from '../utils/productScoring';

// Datos de contacto/tienda online (nombre, teléfono para WhatsApp, sitio web
// para el flujo de "agregar al carrito" cuando la tienda tiene e-commerce
// propio — hoy solo probado contra WooCommerce).
export async function fetchStoreInfo(storeId) {
  const snap = await getDoc(doc(db, 'peluquerias', storeId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    nombre: data.nombre || data.name || 'la tienda',
    telefono: data.telefono || null,
    website: data.website || null,
  };
}

// Peluquerías/tiendas que ya tienen al menos un producto cargado en su catálogo
// propio (panel de empresas — "Mis productos"). Solo esas se ofrecen en el
// selector de tienda del diagnóstico; el resto del directorio (peluquerías
// curadas a mano, sin dueña ni catálogo) queda fuera.
export async function fetchStoresWithCatalog() {
  const snap = await getDocs(collection(db, 'peluquerias'));
  const stores = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => !s._info && s.ownerId);

  const checks = await Promise.all(
    stores.map(async (s) => {
      const productSnap = await getDocs(query(collection(db, 'peluquerias', s.id, 'products'), limit(1)));
      return productSnap.empty ? null : s;
    })
  );

  return checks.filter(Boolean);
}

// Catálogo de una tienda, agrupado por categoría igual que productDB de
// data/products.js, para que scoreProductForProfile/getRecommendedProducts lo
// puedan usar sin distinguir de dónde viene el producto.
export async function fetchStoreProductDB(storeId) {
  const snap = await getDocs(collection(db, 'peluquerias', storeId, 'products'));
  const productDB = {};
  Object.values(CATEGORY_KEY).forEach((key) => { productDB[key] = []; });

  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.active === false) return;
    if (!Array.isArray(data.tags) || data.tags.length === 0) return;
    const key = CATEGORY_KEY[data.category];
    if (!key) return;
    productDB[key].push({
      id: d.id,
      brand: data.brand || '',
      name: data.name || '',
      description: data.description || '',
      category: data.category,
      tags: data.tags,
      weightClass: data.weightClass || null,
      image: data.image || null,
      price: data.price ?? null,
      // TODO: derivar priceTier de price real cuando definamos los umbrales
      // low/mid/high para productos de tienda (hoy solo Amazon los tiene).
      priceTier: 'mid',
      storeId,
      externalProductId: data.externalProductId || null,
    });
  });

  return productDB;
}
