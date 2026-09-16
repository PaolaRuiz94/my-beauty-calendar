import { productDB } from '../data/products';
import { GORRO_SEDA_PRODUCT } from '../data/diagnosisQuestions';
import { scoreProductForProfile } from './productScoring';

export const getScalpCondition = (v) =>
  v === 'Grasa' ? 'Cuero cabelludo graso' : v === 'Seco' ? 'Cuero cabelludo seco' : 'Cuero cabelludo equilibrado';

export const getPorosity = (v) => (v === 'Alta' ? 'Alta' : v === 'Baja' ? 'Baja' : 'Media');

export const buildHairProfile = (answersObject) => {
  const {
    scalp, porosity, density, chemical, texture, objective,
    curlType, strandThickness, elasticity, scalpIssues,
    heatFrequency, length,
  } = answersObject;

  const isLacio = texture === 'Lacio';
  const isOndulado = texture === 'Ondulado';
  const isRizado = texture === 'Rizado';
  const isCoily = texture === 'Coily';
  const isTransicion = texture === 'Transición';
  const isCurly = isRizado || isCoily;
  const isWavy = isOndulado;
  const isCurlyOrWavy = isCurly || isWavy || isTransicion;

  const fineStrand = strandThickness === 'Fino';
  const coarseStrand = strandThickness === 'Grueso';
  const lowDensity = density === 'Escasa';
  const highDensity = density === 'Abundante';
  const fineDensity = lowDensity; // alias de compatibilidad
  const denseDensity = highDensity; // alias para productos con perfil de densidad alta

  const isColor = chemical === 'Color';
  const isAlisado = chemical === 'Alisado';
  const isVarios = chemical === 'Varios';
  const isChemical = isColor || isAlisado || isVarios;
  const isHeatDamaged = chemical === 'Calor' || heatFrequency === 'Frecuente';

  const lowElasticity = elasticity === 'Baja';

  const scalpIssuesList = Array.isArray(scalpIssues) ? scalpIssues : [];
  const hasDandruff = scalpIssuesList.includes('caspa');
  const hasSensitivity = scalpIssuesList.includes('picazon');
  const hasHairLoss = scalpIssuesList.includes('caida');

  const highPorosity = porosity === 'Alta';
  const lowPorosity = porosity === 'Baja';
  const oilyScalp = scalp === 'Grasa';
  const dryScalp = scalp === 'Seco';

  const needsProtein = isChemical || isHeatDamaged || lowElasticity;
  const needsClarifying = oilyScalp || lowPorosity || hasDandruff;
  const isScalpOilyWithDryEnds = oilyScalp && (highPorosity || isChemical);
  const stylingMethod = isCurlyOrWavy ? (highPorosity ? 'LOC' : 'LCO') : null;

  const proteinFrequencyWeeks = (isAlisado || isVarios) ? 2
    : isColor ? 3
    : isHeatDamaged || lowElasticity ? 2
    : 4;

  let damageLevel;
  if ((isAlisado || isVarios) && (highPorosity || lowElasticity)) damageLevel = 'Alto';
  else if (isAlisado || isVarios || (isColor && highPorosity)) damageLevel = 'Moderado-Alto';
  else if (isColor || (isHeatDamaged && highPorosity) || lowElasticity) damageLevel = 'Moderado';
  else damageLevel = 'Bajo';

  const isShort = length === 'Corto';
  const isLong = length === 'Largo';

  return {
    scalp, porosity, density, chemical, texture, objective,
    curlType, strandThickness, elasticity, scalpIssues: scalpIssuesList,
    heatFrequency, length,
    isLacio, isOndulado, isRizado, isCoily, isTransicion,
    isCurly, isWavy, isCurlyOrWavy,
    fineStrand, coarseStrand, lowDensity, highDensity, fineDensity,
    isColor, isAlisado, isVarios, isChemical, isHeatDamaged,
    lowElasticity,
    hasDandruff, hasSensitivity, hasHairLoss,
    highPorosity, lowPorosity, oilyScalp, dryScalp,
    needsProtein, needsClarifying, isScalpOilyWithDryEnds,
    stylingMethod, proteinFrequencyWeeks, damageLevel,
    isShort, isLong, denseDensity,
  };
};

export const getHairType = (answersObject) => {
  const { texture, curlType, strandThickness, chemical } = answersObject;
  const curlSuffix = curlType ? ` ${curlType}` : '';
  const thicknessLabel = strandThickness === 'Fino' ? 'fino'
    : strandThickness === 'Grueso' ? 'grueso' : 'medio';
  const treatedLabel = chemical === 'Natural' ? 'natural'
    : chemical === 'Calor' ? 'natural c/ calor' : 'tratado';
  const base = texture === 'Transición' ? 'Transición capilar' : texture;
  return `${base}${curlSuffix} ${thicknessLabel} / ${treatedLabel}`;
};

export const getObjectiveLabel = (value) => {
  const map = {
    crecimiento: 'Crecimiento', hidratación: 'Hidratación',
    reparación: 'Reparación', definición: 'Definición', volumen: 'Volumen',
  };
  return map[value] || 'Objetivo personalizado';
};

export const getRoutinePlan = (profile, { products = [], treatments = {} } = {}) => {
  const byCategory = {};
  products.forEach(p => { byCategory[p.category] = p; });
  const tag = (text, category, specificProduct = undefined) => ({
    text,
    category,
    product: specificProduct !== undefined ? specificProduct : (byCategory[category] || null),
  });
  const tagGelOrMousse = (text) => {
    const category = byCategory['Gel'] ? 'Gel' : 'Espumas';
    return { text, category, product: byCategory[category] || null };
  };
  const {
    isCurly, isWavy, isCurlyOrWavy, isCoily, isTransicion, objective,
    oilyScalp, dryScalp, highPorosity, needsProtein, isChemical, isHeatDamaged,
    damageLevel, fineStrand, hasDandruff, hasHairLoss,
  } = profile;

  const detoxShampoo = tag(
    hasDandruff ? 'Lavar el cuero cabelludo con masajes circulares (shampoo anticaspa clarificante)'
    : oilyScalp  ? 'Lavar solo en raíz con masajes circulares suaves para resetear el cuero cabelludo'
                 : 'Lavar con masajes circulares para resetear el cabello',
    'Shampoo'
  );

  const hydraShampoo = tag(
    hasDandruff ? 'Lavar con masajes circulares suaves en cuero cabelludo (alternar con clarificante)'
    : oilyScalp  ? 'Lavar solo en raíz con masajes circulares, sin llevar a las puntas'
    : dryScalp   ? 'Lavar con masajes circulares nutritivos en cuero cabelludo'
                 : 'Lavar con masajes circulares suaves en raíz, sin frotar puntas',
    'Shampoo'
  );

  const conditioner = tag(
    highPorosity
      ? 'Aplicar en todo el largo y enjuagar con agua fría para sellar la cutícula'
      : 'Aplicar en medios y puntas, enjuagar con agua templada',
    'Acondicionador'
  );

  const tonicoPreWash = tag(
    hasHairLoss
      ? 'Aplicar tónico estimulante en cuero cabelludo, masajear 5 min — dejar actuar 1 hora antes de lavar'
      : objective === 'crecimiento'
      ? 'Aplicar tónico capilar estimulante en cuero cabelludo — dejar actuar 1 hora antes de lavar'
      : oilyScalp
      ? 'Aplicar tónico equilibrante en cuero cabelludo — dejar actuar 1 hora antes de lavar'
      : dryScalp
      ? 'Aplicar tónico nutritivo en cuero cabelludo — dejar actuar 1 hora antes de lavar'
      : 'Aplicar tónico capilar fortalecedor en cuero cabelludo — dejar actuar 1 hora antes de lavar',
    'Tónico'
  );

  const stylingDaySteps = (isCurly || isCoily)
    ? [
        tag(
          isCoily
            ? 'Aplicar en cabello muy húmedo por secciones (praying hands o shingling)'
            : 'Aplicar de medios a puntas en cabello húmedo (scrunch)',
          'Crema de Peinar'
        ),
        tagGelOrMousse(
          fineStrand
            ? 'Aplicar gel o espuma ligera sobre la crema (scrunch suave, sin presionar)'
            : isCoily
            ? 'Aplicar sobre la crema en cabello muy húmedo para sellar y definir'
            : 'Aplicar sobre cabello húmedo (scrunch de puntas a raíz)'
        ),
      ]
    : isWavy
    ? [tag('Aplicar en medios y puntas sobre cabello húmedo', 'Crema de Peinar'), tagGelOrMousse('Aplicar sobre cabello húmedo para definir ondas (scrunch suave)')]
    : isTransicion
    ? [tag('Aplicar leave-in en zona de raíz natural', 'Crema de Peinar'), tag('Aplicar en puntas tratadas para unificar textura', 'Crema de Peinar')]
    : [tag('Aplicar en medios y puntas sobre cabello húmedo', 'Crema de Peinar')];

  const refreshDaySteps = (isCurly || isCoily)
    ? ['Humedecer con spray de agua y hacer scrunch para reactivar rizos', tagGelOrMousse('Aplicar sobre los rizos húmedos para sellar y refrescar'), tag('Aplicar 1-2 gotas solo en puntas para suavizar', 'Aceites')]
    : isWavy
    ? ['Humedecer con spray refrescante y hacer scrunch suave', tag('Aplicar 1-2 gotas solo en puntas', 'Aceites')]
    : isTransicion
    ? ['Humedecer la zona natural con spray de agua', tag('Aplicar 1-2 gotas solo en puntas tratadas', 'Aceites')]
    : ['Usar shampoo en seco en raíz si es necesario', tag('Aplicar 1-2 gotas solo en puntas', 'Aceites')];

  const nightOil = tag(
    isChemical || damageLevel === 'Alto'
      ? 'Aplicar solo en puntas antes de dormir (reparador)'
      : highPorosity
      ? 'Aplicar en medios y puntas para sellar la hidratación'
      : isHeatDamaged
      ? 'Aplicar 1-2 gotas en puntas antes de dormir'
      : oilyScalp
      ? 'Aplicar máx. 2 gotas solo en puntas, evitar la raíz'
      : 'Aplicar en puntas para nutrirlas durante la noche',
    'Aceites'
  );

  const nightSteps = [tag('Proteger el cabello con gorro de seda o pañuelo de satín', 'Accesorios', GORRO_SEDA_PRODUCT), nightOil];

  // Tratamiento nutritivo — Día 1 (lavado A)
  const treatNutritivo = tag(
    highPorosity || isCoily
      ? 'Aplicar de medios a puntas y dejar actuar 20 min bajo gorro de vapor (nutritivo)'
      : 'Aplicar de medios a puntas y dejar actuar 15 min (nutritivo)',
    'Tratamiento',
    treatments.nutritivo ?? null
  );

  // Tratamiento reparador — Día 3 (lavado B)
  const treatReparador = tag(
    needsProtein
      ? `Aplicar de medios a puntas y dejar actuar ${isChemical ? '20' : '30'} min (reparador proteico)`
      : highPorosity
      ? 'Aplicar de medios a puntas y dejar actuar 20 min bajo calor (reparador)'
      : 'Aplicar de medios a puntas y dejar actuar 15-20 min (reparador)',
    'Tratamiento',
    treatments.reparador ?? null
  );

  // Tratamiento hidratante — Día 5 (lavado C)
  const treatHidratante = tag(
    highPorosity || isCoily
      ? 'Aplicar de medios a puntas y dejar actuar 20 min bajo gorro de vapor (hidratante)'
      : objective === 'hidratación'
      ? 'Aplicar de medios a puntas y dejar actuar 20 min (hidratación profunda)'
      : 'Aplicar de medios a puntas y dejar actuar 15 min (hidratante)',
    'Tratamiento',
    treatments.hidratante ?? null
  );

  // Pasos de lavado A (detox + nutritivo)
  const washASteps = [tonicoPreWash, detoxShampoo, treatNutritivo, conditioner, ...stylingDaySteps];

  // Pasos de lavado B (hidratante + reparador)
  const washBSteps = [tonicoPreWash, hydraShampoo, treatReparador, conditioner, ...stylingDaySteps];

  // Pasos de lavado C (hidratante + hidratante)
  const washCSteps = [tonicoPreWash, hydraShampoo, treatHidratante, conditioner, ...stylingDaySteps];

  return [
    { day: 1, title: 'Lavado A — Nutritivo',   daySteps: washASteps,     nightSteps },
    { day: 2, title: isCurlyOrWavy ? 'Refresco y activación' : 'Descanso', daySteps: refreshDaySteps, nightSteps },
    { day: 3, title: 'Lavado B — Reparador',   daySteps: washBSteps,     nightSteps },
    { day: 4, title: isCurlyOrWavy ? 'Refresco y activación' : 'Descanso', daySteps: refreshDaySteps, nightSteps },
    { day: 5, title: 'Lavado C — Hidratante',  daySteps: washCSteps,     nightSteps },
    { day: 6, title: isCurlyOrWavy ? 'Refresco y activación' : 'Descanso', daySteps: refreshDaySteps, nightSteps },
    { day: 7, title: 'Descanso profundo',       daySteps: ['Masaje suave en cuero cabelludo con yemas de los dedos por 3-5 min (sin productos)', 'Evitar calor, tintes o manipulación excesiva hoy'], nightSteps },
  ];
};

// storeProductDB (opcional): catálogo de una tienda, con la misma forma que
// productDB (agrupado por categoría, mismo shape de scoreProductForProfile).
// Por cada categoría, se usa el catálogo de la tienda si tiene productos
// tageados ahí; si no, se cae al catálogo genérico de Amazon para esa
// categoría puntual — el resto de categorías de la tienda no se ven afectadas.
export const getRecommendedProducts = (profile, storeProductDB = null) => {
  const mergedDB = {};
  Object.keys(productDB).forEach((category) => {
    const storeItems = storeProductDB?.[category];
    mergedDB[category] = (storeItems && storeItems.length > 0) ? storeItems : productDB[category];
  });

  const categoryEntries = Object.entries(mergedDB);
  const allProducts = categoryEntries.flatMap(([category, products]) => products.map((product) => ({ category, product })));

  // Score all products
  const allScored = allProducts.map(entry => ({
    ...entry,
    score: scoreProductForProfile(entry.product, entry.category, profile),
  }));

  // Arma una recomendación completa (cohesión de marca + tratamientos) a partir de un pool de productos ya scoreado
  const buildRecommendationFromPool = (pool) => {
    // Brand cohesion: find the brand with the best combined routine score across all categories
    const brandCatBest = {};
    pool.forEach(({ category, product, score }) => {
      const b = product.brand;
      if (!brandCatBest[b]) brandCatBest[b] = {};
      if (!brandCatBest[b][category] || score > brandCatBest[b][category].score) {
        brandCatBest[b][category] = { product, score };
      }
    });
    const brandTotals = {};
    Object.entries(brandCatBest).forEach(([b, cats]) => {
      brandTotals[b] = Object.values(cats).reduce((s, { score }) => s + Math.max(0, score), 0);
    });
    const routineBrand = Object.entries(brandTotals).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Pick the best product per category from the routine brand; fall back to global best (dentro del mismo pool)
    const globalCatBest = {};
    [...pool].sort((a, b) => b.score - a.score).forEach(({ category, product, score }) => {
      if (!globalCatBest[category]) globalCatBest[category] = { product, score };
    });
    const categoryBest = {};
    Object.keys(mergedDB).forEach(category => {
      const brandEntry = brandCatBest[routineBrand]?.[category];
      categoryBest[category] = (brandEntry && brandEntry.score > 0) ? brandEntry : globalCatBest[category];
    });

    const recommended = Object.keys(mergedDB).map((category) => {
      const best = categoryBest[category];
      if (best && best.score > 0) return best.product;
      // Fallback: primer producto del pool en esa categoría; si no hay, primero del catálogo (tienda o Amazon)
      const poolFallback = pool.find(e => e.category === category)?.product;
      return poolFallback || mergedDB[category][0];
    }).filter(Boolean);

    const totalScore = Object.values(categoryBest).reduce((s, entry) => s + Math.max(0, entry?.score || 0), 0);

    // Seleccionar 3 tratamientos distintos: nutritivo, reparador, hidratante
    const tratamientoScored = pool
      .filter(({ category }) => category === 'tratamiento')
      .sort((a, b) => b.score - a.score);

    const brandTratamientos = tratamientoScored.filter(({ product }) => product.brand === routineBrand);
    const treatPool = brandTratamientos.length >= 3 ? brandTratamientos : tratamientoScored;

    const pickTreat = (keywords, exclude = []) => {
      const match = treatPool.find(({ product }) =>
        !exclude.includes(product.id) &&
        keywords.some(kw => (product.tags || []).some(t => t.toLowerCase().includes(kw)))
      ) || treatPool.find(({ product }) => !exclude.includes(product.id));
      return match?.product || null;
    };

    const treatNutritivo = pickTreat(['nutritivo', 'nutrición', 'regenerante', 'suavizante']);
    const usedAfterN = treatNutritivo ? [treatNutritivo.id] : [];
    const treatReparador = pickTreat(['reparador', 'daño', 'bond', 'fortalecimiento', 'proteína'], usedAfterN);
    const usedAfterR = [...usedAfterN, ...(treatReparador ? [treatReparador.id] : [])];
    const treatHidratante = pickTreat(['hidratante', 'humectante', 'hidratación', 'brillo', 'suavidad'], usedAfterR);

    return {
      products: recommended,
      treatments: {
        nutritivo:  treatNutritivo  || recommended.find(p => p?.category === 'Tratamiento') || null,
        reparador:  treatReparador  || recommended.find(p => p?.category === 'Tratamiento') || null,
        hidratante: treatHidratante || recommended.find(p => p?.category === 'Tratamiento') || null,
      },
      totalScore,
    };
  };

  // 3 recomendaciones alternativas por presupuesto (heurística de precio por marca)
  const tiers = ['low', 'mid', 'high'];
  const byTier = {};
  tiers.forEach((tier) => {
    const tierPool = allScored.filter(({ product }) => (product.priceTier || 'mid') === tier);
    byTier[tier] = buildRecommendationFromPool(tierPool.length > 0 ? tierPool : allScored);
  });

  // La "más acertada" es la de mayor score total; esa es la que se muestra por defecto
  const defaultTier = tiers.reduce(
    (best, t) => (byTier[t].totalScore > byTier[best].totalScore ? t : best),
    'mid'
  );

  return {
    products: byTier[defaultTier].products,
    treatments: byTier[defaultTier].treatments,
    byTier,
    defaultTier,
  };
};

export const getCategorizedProducts = (products) => {
  const categoriesMap = new Map();
  // Orden personalizado
  ['Shampoo', 'Tratamiento', 'Acondicionador', 'Crema de Peinar', 'Gel', 'Espumas', 'Aceites'].forEach(cat => categoriesMap.set(cat, []));

  products.forEach((product) => {
    const key = product.category?.trim();
    if (categoriesMap.has(key)) categoriesMap.get(key).push(product);
  });

  // Convertir a objeto manteniendo orden
  return Object.fromEntries(categoriesMap);
};

export const getRoutineSteps = (profile) => {
  const {
    oilyScalp, dryScalp, highPorosity, lowPorosity, needsProtein,
    stylingMethod, isScalpOilyWithDryEnds, damageLevel, fineDensity,
    proteinFrequencyWeeks, isCurly, isWavy, isCoily, isTransicion,
    hasDandruff, hasSensitivity, fineStrand, coarseStrand, lowElasticity,
  } = profile;

  const shampoo = hasDandruff
    ? 'Shampoo anticaspa (zinc o ketoconazol) en cuero cabelludo — alterna con shampoo suave hidratante'
    : hasSensitivity
    ? 'Shampoo hipoalergénico sin sulfatos ni fragancia, masaje muy suave'
    : oilyScalp
    ? 'Shampoo equilibrante aplicado solo en la raíz. No llevar a las puntas.'
    : dryScalp
    ? 'Shampoo nutritivo suave con masaje circular en cuero cabelludo'
    : 'Shampoo hidratante con movimientos circulares suaves en raíz';

  const conditioner = lowPorosity
    ? 'Acondicionador ligero (medios → puntas), dejar 3 min con agua tibia para activar absorción'
    : highPorosity
    ? 'Acondicionador nutritivo (todo el largo), enjuagar con agua fría para sellar la cutícula'
    : 'Acondicionador nutritivo (medios y puntas), enjuague templado';

  const treatment = damageLevel === 'Alto'
    ? 'Mascarilla reparadora con bond builders o proteínas (1x por semana)'
    : damageLevel === 'Moderado-Alto'
    ? 'Mascarilla proteica ligera cada 2 semanas + mascarilla hidratante la otra semana'
    : needsProtein || lowElasticity
    ? 'Alternar: mascarilla proteica cada 3-4 semanas con mascarilla hidratante las demás'
    : 'Mascarilla hidratante profunda cada 1-2 semanas';

  let leaveIn;
  if (isTransicion) {
    leaveIn = 'Zona de raíz natural: leave-in hidratante ligero. Zona de puntas tratadas: acondicionador sin enjuague nutritivo para equilibrar.';
  } else if (stylingMethod === 'LOC') {
    leaveIn = fineStrand
      ? 'L: Leave-in ligero → O: Aceite en puntas (1-2 gotas) → C: Crema ligera de peinar'
      : 'L: Leave-in → O: Aceite sellador en puntas → C: Crema de peinar para definir';
  } else if (stylingMethod === 'LCO') {
    leaveIn = 'L: Leave-in → C: Crema de peinar para definir → O: Aceite ligero para sellar';
  } else {
    leaveIn = oilyScalp
      ? 'Leave-in muy ligero solo en puntas, evitar acercarse a la raíz'
      : 'Leave-in nutritivo en medios y puntas';
  }

  const oil = isScalpOilyWithDryEnds
    ? 'Aceite solo en puntas y medios (zona tratada). No tocar raíz.'
    : oilyScalp
    ? 'Aceite ultra ligero únicamente en puntas (máx. 2 gotas)'
    : coarseStrand
    ? 'Aceite nutritivo denso (karité o aguacate) en medios y puntas para penetrar la cutícula gruesa'
    : 'Aceite nutritivo para sellar la hidratación en medios y puntas';

  let gel = null;
  if (isTransicion) {
    gel = 'Crema de peinar ligera en zona de raíz natural y gel o espuma en las puntas tratadas para unificar la textura.';
  } else if (isCurly || isCoily) {
    gel = fineDensity
      ? 'Gel ligero para rizos finos sobre cabello húmedo (scrunch suave). Evita frotar para no romper el rizo.'
      : isCoily
      ? 'Gel fuerte o manteca de styling sobre cabello muy húmedo (shingling o praying hands). Deja secar sin tocar.'
      : 'Gel de fijación media-fuerte sobre cabello húmedo (scrunch de puntas a raíz). Deja el cast secar antes de romperlo.';
  } else if (isWavy) {
    gel = 'Gel ligero o espuma sobre cabello húmedo para definir ondas sin pesarlas (scrunch suave).';
  }

  const steps = [
    { label: 'Shampoo', value: shampoo },
    { label: 'Acondicionador', value: conditioner },
    { label: 'Tratamiento', value: treatment },
    { label: stylingMethod ? `Método ${stylingMethod}` : 'Leave-in', value: leaveIn },
  ];
  if (gel) steps.push({ label: 'Gel definidor', value: gel });
  steps.push({ label: 'Aceite sellador', value: oil });
  if (needsProtein) {
    steps.push({ label: 'Frecuencia proteica', value: `Tratamiento proteico cada ${proteinFrequencyWeeks} semanas. Siempre seguir con mascarilla hidratante.` });
  } else if (lowElasticity) {
    steps.push({ label: 'Elasticidad', value: 'Incluye tratamiento proteico ligero cada 3-4 semanas para recuperar la elasticidad. Sigue siempre con hidratación.' });
  }
  return steps;
};

export const getPersonalizedTips = (profile) => {
  const tips = [];
  const {
    oilyScalp, dryScalp, highPorosity, lowPorosity, isChemical, isHeatDamaged, isAlisado,
    needsProtein, isScalpOilyWithDryEnds, isCurlyOrWavy, damageLevel, stylingMethod,
    hasDandruff, hasSensitivity, hasHairLoss, lowElasticity, isTransicion, isCoily,
    heatFrequency, fineStrand, coarseStrand,
  } = profile;

  if (isTransicion) tips.push({
    title: 'Cuidado en transición capilar',
    description: 'Tu cabello tiene dos zonas con necesidades distintas: la raíz natural necesita hidratación y definición, mientras que las puntas tratadas necesitan reparación. Trabaja en secciones y evita estirar el punto de demarcación para reducir el quiebre.',
    videoQuery: 'transición capilar cabello cuidado',
  });
  if (isScalpOilyWithDryEnds) tips.push({
    title: 'Tratamiento por zonas',
    description: 'Tu raíz produce exceso de sebo pero las puntas están secas o dañadas. Aplica el shampoo solo en la raíz y el acondicionador/mascarilla solo en medios y puntas. Los aceites pesados en la raíz agravan la oleosidad.',
    videoQuery: 'tratamiento cabello raíz grasosa puntas secas',
  });
  if (isCoily) tips.push({
    title: 'Hidratación profunda para cabello coily',
    description: 'El cabello afrorizado es naturalmente más seco porque el sebo tarda en bajar por la espiral del cabello. Aplica el método LOC o LCO cada vez que mojes y usa mascarillas intensivas semanales. El pre-poo con aceite antes del lavado protege las puntas.',
    videoQuery: 'cabello afrorizado hidratación LOC LCO método',
  });
  if (isCurlyOrWavy && fineStrand) tips.push({
    title: 'Productos ligeros para rizo fino',
    description: 'Tu cabello fino y rizado necesita definición sin peso. Las mousses y espumas ligeras definen sin aplanar el rizo. Las cremas muy pesadas o el exceso de aceite quitan volumen. Prefiere geles fluidos sobre cremas densas.',
    videoQuery: 'cabello rizado fino productos ligeros definición',
  });
  if (hasDandruff) tips.push({
    title: 'Control de caspa',
    description: 'La caspa puede ser oleosa (escamas amarillentas) o seca (escamas blancas). Usa shampoo con zinc piritionato o ketoconazol 2 veces/semana. Evita agua muy caliente y alterna con shampoo nutritivo para no resecar el cuero cabelludo.',
    videoQuery: 'control caspa shampoo anticaspa',
  });
  if (hasHairLoss) tips.push({
    title: 'Estimular el folículo capilar',
    description: 'Incorpora un tónico estimulante con cafeína o biotina directamente en el cuero cabelludo. Masajea 3-5 minutos al aplicarlo para activar la circulación. Evita colas y peinados muy tensos que traccionan el folículo.',
    videoQuery: 'caída cabello estimular folículos masaje cuero cabelludo',
  });
  if (hasSensitivity) tips.push({
    title: 'Cuero cabelludo sensible',
    description: 'Evita productos con alcohol deshidratante, parfum y sulfatos agresivos. Enjuaga siempre con agua fría al final para cerrar los poros. Haz una prueba de parche antes de introducir nuevos productos.',
    videoQuery: 'cuero cabelludo sensible irritación productos suaves',
  });
  if (lowElasticity) tips.push({
    title: 'Recupera la elasticidad',
    description: 'La elasticidad baja indica déficit de proteína en la corteza. Incorpora una mascarilla proteica ligera (hidrolizada) cada 2-3 semanas y sigue siempre con una hidratante. Si el cabello se vuelve rígido o crujiente, pausa la proteína y enfócate en hidratación.',
    videoQuery: 'elasticidad cabello proteína tratamiento recuperar',
  });
  if (coarseStrand) tips.push({
    title: 'Cabello grueso — penetración profunda',
    description: 'La cutícula gruesa necesita calor suave para abrir y absorber productos. Aplica mascarillas bajo un gorro de ducha durante 20-30 min. Los aceites densos como coco o aguacate penetran mejor que los silicones.',
    videoQuery: 'cabello grueso mascarilla profunda penetración',
  });
  if (isChemical && dryScalp) tips.push({
    title: 'Reparación sin agravar la sequedad',
    description: 'El proceso químico combinado con cuero cabelludo seco requiere bond builders (como Olaplex) que reparan sin resecar. Lava máximo 2 veces por semana con shampoo ultra suave libre de sulfatos.',
    videoQuery: 'cabello procesado cuero cabelludo seco Olaplex reparación',
  });
  if (oilyScalp && !isScalpOilyWithDryEnds) tips.push({
    title: 'Limpieza selectiva en raíz',
    description: 'Aplica el shampoo exclusivamente en el cuero cabelludo, sin frotar el largo. Lavar las puntas con frecuencia las reseca y aumenta la producción de sebo. Termina con agua fría para cerrar los poros.',
    videoQuery: 'cuero cabelludo grasoso limpieza selectiva raíz',
  });
  if (highPorosity) tips.push({
    title: 'Sella la cutícula abierta',
    description: 'La porosidad alta indica cutículas levantadas que pierden humedad fácilmente. Termina siempre con agua fría, aplica aceite después del leave-in para sellar, y evita agua caliente que abre más la cutícula.',
    videoQuery: 'porosidad alta cabello sellar cutícula agua fría',
  });
  if (lowPorosity) tips.push({
    title: 'Activa la absorción con calor suave',
    description: 'La porosidad baja resiste la entrada de productos. Aplica tratamientos con el cabello húmedo y cálido (gorro de vapor o toalla tibia), dejando actuar más tiempo. El calor suave abre la cutícula temporalmente.',
    videoQuery: 'porosidad baja cabello calor vapor absorción',
  });
  if (needsProtein && !lowElasticity) tips.push({
    title: 'Balance proteína / hidratación',
    description: 'Si el cabello se siente rígido o crujiente, es exceso de proteína; si se estira sin volver y se rompe fácil, falta proteína. Siempre sigue un tratamiento proteico con una mascarilla hidratante.',
    videoQuery: 'balance proteína hidratación cabello tratamiento',
  });
  if (isCurlyOrWavy && stylingMethod) tips.push({
    title: `Método ${stylingMethod} para tus rizos`,
    description: stylingMethod === 'LOC'
      ? 'Alta porosidad → LOC: Leave-in (hidratación) → Oil (sella antes de que se evapore) → Cream (define). El aceite entre capas protege la humedad del leave-in.'
      : 'Porosidad media → LCO: Leave-in → Cream (define y penetra mejor) → Oil (sella al final). La crema funciona mejor sobre el leave-in antes del aceite en tu tipo de porosidad.',
    videoQuery: `método ${stylingMethod} cabello rizado rizos`,
  });
  if (heatFrequency === 'Frecuente' || (isHeatDamaged && !isAlisado)) tips.push({
    title: 'Protección térmica siempre',
    description: 'Aplica siempre un protector térmico antes de cualquier herramienta con calor. Usa temperatura máxima de 180°C y no repases la misma sección más de dos veces.',
    videoQuery: 'protector térmico cabello heat protectant secador',
  });
  if (damageLevel === 'Alto') tips.push({
    title: 'Reconstrucción progresiva',
    description: 'Con daño alto, los tratamientos reparadores semanales son esenciales durante al menos 4-6 semanas. Evita el calor directo y usa difusor a temperatura baja si necesitas secar.',
    videoQuery: 'cabello dañado reparación tratamiento intensivo',
  });
  if (damageLevel === 'Bajo' && !lowElasticity && !hasDandruff && !hasHairLoss) tips.push({
    title: 'Mantén la salud sin sobretratar',
    description: 'Tu cabello está en buen estado. Elige productos ligeros y evita acumular tratamientos innecesarios. Una rutina simple y consistente es más efectiva que muchos productos.',
    videoQuery: 'rutina cabello simple mantenimiento salud',
  });
  return tips.slice(0, 5);
};

export const getFrequencyRecommendations = (profile) => {
  const {
    oilyScalp, dryScalp, isCoily, hasDandruff,
    highPorosity, lowPorosity, needsProtein, isChemical,
    isCurlyOrWavy, hasHairLoss,
  } = profile;

  const washNote = hasDandruff
    ? 'Día 1: shampoo clarificante anticaspa. Días 3 y 5: shampoo suave hidratante.'
    : oilyScalp
    ? 'Los 3 días aplica solo en raíz con masajes circulares, sin llevar a puntas.'
    : dryScalp || isCoily
    ? '3 veces/semana. Si el cuero cabelludo lo tolera, puedes reducir a 2 lavados ajustando los días de descanso.'
    : '3 veces/semana (días alternos). Mínimo día de por medio — no dejar pasar más de 2 días sin lavar.';

  const treatNote = needsProtein
    ? 'Nutritivo (Lav. A) → Reparador proteico (Lav. B, 20-30 min) → Hidratante (Lav. C). El reparador actúa como tratamiento proteico.'
    : isChemical
    ? 'Nutritivo (Lav. A) → Reparador bond-builder (Lav. B, 20 min) → Hidratante (Lav. C). Rotar en cada lavado.'
    : 'Nutritivo (Lav. A) → Reparador (Lav. B) → Hidratante (Lav. C). Rotar en cada lavado, siempre que te laves.';

  const tonicoNote = hasHairLoss
    ? '3 veces/semana, 1 hora antes de cada lavado. Masajear 5 min para activar circulación.'
    : '3 veces/semana, 1 hora antes de cada lavado. Masajear con yemas de los dedos.';

  const nightNote = highPorosity
    ? 'Cada noche: gorro de seda + aceite en medios y puntas para sellar la hidratación.'
    : 'Cada noche: gorro de seda + aceite solo en puntas.';

  const refreshNote = isCurlyOrWavy
    ? 'Días 2, 4 y 6 (sin lavado): humedecer con spray y aplicar gel o espuma para reactivar la forma.'
    : lowPorosity
    ? 'Días de descanso: evitar agua y productos — el cabello necesita tiempo sin saturar.'
    : 'Días de descanso: hidratación mínima con aceite en puntas si es necesario.';

  return [
    { label: 'Lavado',              value: washNote },
    { label: 'Tratamiento',         value: treatNote },
    { label: 'Tónico capilar',      value: tonicoNote },
    { label: 'Rutina nocturna',     value: nightNote },
    { label: 'Días de descanso',    value: refreshNote },
  ];
};
