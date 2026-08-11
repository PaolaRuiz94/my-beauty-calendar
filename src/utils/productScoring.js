// productScoring.js — qué tan bien le sirve un producto a un perfil capilar
//
// Usado por DiagnosisScreen (armar la rutina inicial) y por CalendarScreen
// (mostrar alternativas de reemplazo que también le funcionen al usuario).

const normalize = (value) => String(value || '').toLowerCase();
const hasTag = (product, tag) => (product.tags || []).some((t) => normalize(t).includes(tag));
const matchesAnyTag = (product, tags) => tags.some((tag) => hasTag(product, tag));

export function scoreProductForProfile(product, category, profile) {
  let score = 0;
  const tags = (product.tags || []).map(normalize);
  const addIf = (condition, value) => { if (condition) score += value; };

  addIf(profile.isChemical, matchesAnyTag(product, ['reparador', 'daño', 'protección', 'protectora']) ? 2 : 0);
  addIf(profile.isColor, matchesAnyTag(product, ['brillo', 'protección', 'reparador', 'suavidad']) ? 2 : 0);
  addIf(profile.isAlisado, matchesAnyTag(product, ['alisado', 'desenredo', 'ligero', 'suave']) ? 2 : 0);
  addIf(profile.isHeatDamaged, matchesAnyTag(product, ['reparador', 'daño', 'protección', 'suavidad']) ? 2 : 0);
  addIf(profile.oilyScalp || profile.lowPorosity, matchesAnyTag(product, ['clarificante', 'detox', 'limpieza profunda']) ? 3 : 0);
  addIf(profile.oilyScalp, matchesAnyTag(product, ['ligero', 'suave', 'diario', 'clarificante', 'detox']) ? 2 : 0);
  addIf(profile.dryScalp, matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 2 : 0);
  addIf(profile.highPorosity, matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 2 : 0);
  addIf(profile.lowPorosity, matchesAnyTag(product, ['ligero', 'sin peso', 'suave']) ? 2 : 0);
  addIf(profile.needsProtein, matchesAnyTag(product, ['reparador', 'fortalecimiento', 'daño']) ? 2 : 0);
  addIf(profile.lowElasticity, matchesAnyTag(product, ['reparador', 'fortalecimiento', 'daño']) ? 2 : 0);
  addIf(profile.hasDandruff, matchesAnyTag(product, ['suave', 'limpia', 'equilibrio']) ? 1 : 0);
  addIf(profile.hasSensitivity, matchesAnyTag(product, ['suave', 'ligero']) ? 1 : 0);
  addIf(profile.isCurlyOrWavy, matchesAnyTag(product, ['rizos', 'definición', 'anti-frizz', 'fijación', 'control']) ? 2 : 0);
  addIf(profile.fineStrand, matchesAnyTag(product, ['ligero', 'definición', 'suavidad']) ? 1 : 0);
  addIf(profile.coarseStrand, matchesAnyTag(product, ['nutritivo', 'suavidad', 'reparador']) ? 1 : 0);
  addIf(profile.fineDensity, matchesAnyTag(product, ['ligero', 'volumen', 'definición']) ? 1 : 0);
  addIf(profile.highDensity, matchesAnyTag(product, ['ligero', 'volumen', 'nutritivo']) ? 1 : 0);
  addIf(profile.objective === 'hidratación', matchesAnyTag(product, ['hidratante', 'nutritivo', 'suavidad']) ? 3 : 0);
  addIf(profile.objective === 'reparación', matchesAnyTag(product, ['reparador', 'daño', 'fortalecimiento']) ? 3 : 0);
  addIf(profile.objective === 'definición', matchesAnyTag(product, ['definición', 'rizos', 'fijación', 'control']) ? 3 : 0);
  addIf(profile.objective === 'volumen', matchesAnyTag(product, ['volumen', 'ligera', 'textura']) ? 3 : 0);
  addIf(profile.objective === 'crecimiento', matchesAnyTag(product, ['suavidad', 'equilibrio', 'ligero']) ? 1 : 0);
  addIf(profile.length === 'Largo', matchesAnyTag(product, ['brillo', 'nutritivo', 'suavidad']) ? 1 : 0);
  addIf(profile.length === 'Corto', matchesAnyTag(product, ['volumen', 'ligero', 'definición']) ? 1 : 0);

  if (category === 'shampoo' && profile.scalp === 'Grasa' && tags.includes('reparador')) score -= 1;
  if ((category === 'cremaDePeinar' || category === 'espumas' || category === 'gel') && profile.texture === 'Lacio') score -= 1;

  const STYLING_CATS = ['cremaDePeinar', 'espumas', 'gel'];
  if (product.weightClass && STYLING_CATS.includes(category)) {
    const needsHeavy = profile.isCoily || profile.isRizado;
    const needsMedium = profile.isOndulado;
    const needsLight = profile.isLacio;
    if (needsHeavy) {
      if (product.weightClass === 'pesado') score += 3;
      else if (product.weightClass === 'medio') score += 1;
      else score -= 3;
    } else if (needsMedium) {
      if (product.weightClass === 'pesado') score += 1;
      else if (product.weightClass === 'medio') score += 2;
      else score -= 1;
    } else if (needsLight) {
      if (product.weightClass === 'ligero') score += 2;
      else if (product.weightClass === 'medio') score += 0;
      else score -= 2;
    }
  }

  return score;
}

// Convierte el nombre de categoría del catálogo ('Shampoo', 'Crema de Peinar', ...)
// a la clave usada por scoreProductForProfile ('shampoo', 'cremaDePeinar', ...)
export const CATEGORY_KEY = {
  'Shampoo':         'shampoo',
  'Tratamiento':     'tratamiento',
  'Acondicionador':  'acondicionador',
  'Crema de Peinar': 'cremaDePeinar',
  'Gel':             'gel',
  'Espumas':         'espumas',
  'Aceites':         'aceites',
  'Tónico':          'tonico',
};

// Productos de una categoría que le funcionan a este perfil, ordenados por relevancia.
// Si nada tiene score positivo (o no hay perfil), devuelve la categoría completa sin filtrar.
export function getMatchingProducts(products, categoryLabel, profile) {
  const categoryKey = CATEGORY_KEY[categoryLabel] || categoryLabel;
  const inCategory = products.filter(p => p.category === categoryLabel);
  if (!profile) return inCategory;

  const scored = inCategory
    .map(product => ({ product, score: scoreProductForProfile(product, categoryKey, profile) }))
    .sort((a, b) => b.score - a.score);

  const positive = scored.filter(({ score }) => score > 0);
  return (positive.length > 0 ? positive : scored).map(({ product }) => product);
}

// Productos de TODO el catálogo que le funcionan a un perfil, dado solo un
// arreglo de flags booleanos verdaderos (ej. ['oilyScalp', 'isChemical']),
// como el que se guarda en AsyncStorage. Usado donde no hay el perfil completo.
export function getMatchingProductsByFlags(products, profileFlags = []) {
  if (profileFlags.length === 0) return products;

  const pseudoProfile = Object.fromEntries(profileFlags.map((f) => [f, true]));
  const scored = products
    .map(product => ({
      product,
      score: scoreProductForProfile(product, CATEGORY_KEY[product.category] || product.category, pseudoProfile),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.filter(({ score }) => score > 0).map(({ product }) => product);
}
