// Tónicos de crecimiento, fortalecedores y accesorios

export const productsSeedV5 = [

  // ─── TÓNICOS Y FORTALECEDORES ────────────────────────────────────────────────

  {
    id: 'hairg-hair-boomer',
    brand: 'The Hair Generation',
    name: 'Hair Boomer',
    description: 'Aceite capilar fortalecedor con fórmula ancestral y biotecnología. Mezcla de aceites de coco, arroz, jojoba, uva, ricino, peppermint y romero. Estimula el cuero cabelludo, reduce la caída y aporta brillo y suavidad.',
    category: 'Tónico',
    tags: ['crecimiento', 'fortalecedor', 'aceite capilar', 'cuero cabelludo', 'anticaída', 'nutrición', 'brillo', 'romero', 'biotecnología'],
    profiles: ['oilyScalp', 'dryScalp', 'hasHairLoss', 'needsProtein', 'isCurlyOrWavy', 'isRizado', 'isOndulado', 'isCoily', 'isLacio'],
    image: 'https://cdn.shopify.com/s/files/1/0897/4044/3938/files/1.png?v=1769617817',
    link: 'https://thehairg.com/products/hair-boomer',
  },

  {
    id: 'kerastase-genesis-serum-anti-chute',
    brand: 'Kérastase',
    name: 'Genesis Sérum Anti-Chute Fortifiant',
    description: 'Sérum anticaída fortalecedor con edelweiss y glutamina. Reduce la caída por fragilidad hasta un 97%. Fortalece la fibra capilar desde la raíz y revitaliza el cuero cabelludo para un cabello más resistente.',
    category: 'Tónico',
    tags: ['anticaída', 'fortalecedor', 'sérum', 'cuero cabelludo', 'edelweiss', 'glutamina', 'raíz', 'fragilidad'],
    profiles: ['hasHairLoss', 'needsProtein', 'oilyScalp', 'dryScalp', 'highPorosity', 'isRizado', 'isOndulado', 'isLacio'],
    link: 'https://www.kerastase.com.co/genesis/serum-anti-chute-fortifiant',
  },

  {
    id: 'the-ordinary-multi-peptide-serum',
    brand: 'The Ordinary',
    name: 'Multi-Peptide Serum for Hair Density',
    description: 'Sérum multi-péptido para aumentar la densidad capilar y frenar la caída. Combina biotina, REDENSYL, CAPIXYL y péptidos de señalización que estimulan el crecimiento y fortalecen el cuero cabelludo.',
    category: 'Tónico',
    tags: ['péptidos', 'densidad', 'anticaída', 'crecimiento', 'biotina', 'cuero cabelludo', 'fortalecedor', 'REDENSYL', 'CAPIXYL'],
    profiles: ['hasHairLoss', 'needsProtein', 'oilyScalp', 'lowPorosity', 'highPorosity', 'isLacio', 'isOndulado', 'isRizado', 'isCoily', 'isCurlyOrWavy'],
    link: 'https://theordinary.com/products/multi-peptide-serum-for-hair-density',
  },

  // ─── ACCESORIOS ───────────────────────────────────────────────────────────────

  {
    id: 'malma-gorro-seda',
    brand: 'Malma',
    name: 'Gorro de Seda',
    description: 'Gorro de seda 100% para proteger el cabello durante el sueño. Mantiene la hidratación natural, reduce el quiebre y previene el frizz causado por la fricción con la almohada. Diseño elástico para todos los tamaños.',
    category: 'Accesorios',
    tags: ['seda', 'protección nocturna', 'hidratación', 'antifrizz', 'rizos', 'protección'],
    profiles: ['isCurlyOrWavy', 'highPorosity', 'dryScalp', 'isRizado', 'isOndulado', 'isCoily', 'isLacio'],
    image: 'https://malma.com.co/cdn/shop/files/5E23AF1B-DDB8-44CE-93A8-78AC914E4A39.jpg',
    link: 'https://malma.com.co/products/gorro-de-seda',
  },

];
