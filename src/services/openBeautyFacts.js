import { productDB, recommendationDB } from '../data/productDB';
import { buildSearchTermsFromProfile, getPrimaryOBFCategory } from '../data/ingredientMapping';

const OBF_BASE = 'https://world.openbeautyfacts.org';
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Normaliza un producto OBF al mismo shape que productDB
function normalizeOBFProduct(obfProduct) {
  const name = obfProduct.product_name || obfProduct.product_name_es || '';
  const brand = obfProduct.brands || '';
  const category = obfProduct.categories_tags?.[0]?.replace('en:', '') ?? 'hair-care';
  const image = obfProduct.image_front_url || obfProduct.image_url || null;
  const barcode = obfProduct.code || obfProduct._id || null;

  return {
    id: `obf-${barcode ?? name.replace(/\s+/g, '-').toLowerCase()}`,
    brand,
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name,
    description: obfProduct.generic_name || '',
    category: mapOBFCategoryToLocal(category),
    tags: obfProduct.labels_tags?.map(t => t.replace('en:', '')) ?? [],
    image,
    barcode,
    source: 'obf',
  };
}

function mapOBFCategoryToLocal(obfCategory) {
  const lower = obfCategory.toLowerCase();
  if (lower.includes('shampoo') || lower.includes('cleansing')) return 'Shampoo';
  if (lower.includes('conditioner') || lower.includes('acondicionador')) return 'Acondicionador';
  if (lower.includes('treatment') || lower.includes('mask') || lower.includes('masque')) return 'Tratamiento';
  if (lower.includes('styling') || lower.includes('cream') || lower.includes('crema')) return 'Crema de Peinar';
  if (lower.includes('gel')) return 'Gel';
  if (lower.includes('foam') || lower.includes('mousse')) return 'Espumas';
  if (lower.includes('oil') || lower.includes('serum')) return 'Aceites';
  return 'Tratamiento';
}

// ── Por código de barras ──────────────────────────────────────────────────────

export async function fetchProductByBarcode(barcode) {
  try {
    const data = await fetchWithTimeout(`${OBF_BASE}/api/v0/product/${barcode}.json`);
    if (data.status !== 1 || !data.product) return null;
    const normalized = normalizeOBFProduct(data.product);
    if (!normalized.name) return null;
    return normalized;
  } catch {
    return null;
  }
}

// ── Por perfil de diagnóstico (recomendaciones) ───────────────────────────────

export async function fetchRecommendationsByProfile(profile) {
  try {
    const category = getPrimaryOBFCategory(profile);

    // Busca por categoría solamente — más confiable que buscar por ingrediente
    const url =
      `${OBF_BASE}/cgi/search.pl` +
      `?tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}` +
      `&action=process&json=1&page_size=24` +
      `&fields=product_name,product_name_es,brands,categories_tags,labels_tags,image_front_url,image_url,generic_name,code`;

    const data = await fetchWithTimeout(url);
    const products = (data.products ?? [])
      .map(normalizeOBFProduct)
      .filter(p => p.name.trim().length > 2)
      .slice(0, 12);

    if (products.length === 0) return getLocalFallback(profile);
    return products;
  } catch {
    return getLocalFallback(profile);
  }
}

// ── Búsqueda libre (para el selector de productos en rutina) ─────────────────

export async function searchProducts(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url =
      `${OBF_BASE}/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(query.trim())}` +
      `&tagtype_0=categories&tag_contains_0=contains&tag_0=hair-care` +
      `&action=process&json=1&page_size=15&fields=product_name,product_name_es,brands,categories_tags,labels_tags,image_front_url,image_url,generic_name,code`;

    const data = await fetchWithTimeout(url);
    return (data.products ?? [])
      .map(normalizeOBFProduct)
      .filter(p => p.name.trim().length > 2);
  } catch {
    return [];
  }
}

// ── Fallback local ───────────────────────────────────────────────────────────

function getLocalFallback(profile = {}) {
  const { oilyScalp, highPorosity, isChemical, isCurlyOrWavy, fineDensity } = profile;
  if (isChemical) return [...(recommendationDB.repair ?? []), ...(productDB.acondicionador ?? [])];
  if (highPorosity) return recommendationDB.hydra ?? [];
  if (oilyScalp) return recommendationDB.balance ?? [];
  if (isCurlyOrWavy) return [...(recommendationDB.curl ?? []), ...(fineDensity ? productDB.espumas : [])];
  return Object.values(productDB).flat();
}
