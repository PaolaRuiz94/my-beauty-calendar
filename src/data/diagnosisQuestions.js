import { PRODUCTS } from './products';

// Países ofrecidos en el selector de país (paso previo al diagnóstico). Solo
// 'Colombia' habilita el selector de tienda/peluquería — el resto usa siempre
// el catálogo genérico de Amazon.
export const COUNTRY_OPTIONS = [
  { value: 'Colombia', title: 'Colombia', desc: 'Podrás elegir una tienda o peluquería para tu diagnóstico.' },
  { value: 'Estados Unidos', title: 'Estados Unidos', desc: 'Diagnóstico con catálogo genérico.' },
];

// Único producto de la categoría "Accesorios" — no participa en el algoritmo de
// recomendación (productDB no incluye esa categoría), así que se asigna directo
// para que el paso de "gorro de seda" siempre tenga la misma foto.
export const GORRO_SEDA_PRODUCT = PRODUCTS.find(p => p.id === 'malma-gorro-seda') || null;

export const STEP_TO_KEY = {
  shampoo: 'lavado',
  acondicionador: 'lavado',
  tratamiento: 'tratamiento',
  'leave-in': 'definicion',
  'gel definidor': 'definicion',
  'aceite sellador': 'secado',
};

export function getStepVideoKey(label, texture) {
  if (!label || !texture) return null;
  const lower = label.toLowerCase();
  const stepKey = lower.startsWith('método') ? 'definicion' : STEP_TO_KEY[lower];
  return stepKey ? `${texture.toLowerCase()}_${stepKey}` : null;
}

// Opciones de subtipo de rizo filtradas por textura
export const CURL_TYPE_OPTIONS = {
  Ondulado: [
    { value: '2A', title: '2A — Ondulado sutil', desc: 'Ondas suaves que tienden a desaparecer con humedad o peso.' },
    { value: '2B', title: '2B — Ondulado definido', desc: 'Ondas en S con volumen y resistencia al aplastarse.' },
    { value: '2C', title: '2C — Ondulado pronunciado', desc: 'Ondas marcadas que rozan el rizo, con volumen notorio.' },
  ],
  Rizado: [
    { value: '3A', title: '3A — Rizo amplio', desc: 'Rizos grandes y brillosos, fáciles de definir.' },
    { value: '3B', title: '3B — Rizo mediano', desc: 'Rizos compactos y elásticos con buen rebote.' },
    { value: '3C', title: '3C — Rizo apretado', desc: 'Rizos pequeños y densos, mucha retracción al secar.' },
  ],
  Coily: [
    { value: '4A', title: '4A — Coily suave', desc: 'Espirales apretadas con patrón S visible y algo de brillo.' },
    { value: '4B', title: '4B — Coily angular', desc: 'Patrón en Z o zig-zag, gran retracción y volumen.' },
    { value: '4C', title: '4C — Coily denso', desc: 'Patrón muy apretado, poca definición visible, máxima retracción.' },
  ],
};

export const questions = [
  // Módulo 1 — Textura y patrón
  {
    id: 'texture',
    title: '¿Cuál es tu textura de cabello?',
    options: [
      { value: 'Lacio', title: 'Lacio', desc: 'Textura suave y lineal, sin rizos ni ondas.' },
      { value: 'Ondulado', title: 'Ondulado', desc: 'Movimiento natural con ondas que van de sutiles a pronunciadas.' },
      { value: 'Rizado', title: 'Rizado', desc: 'Rizos definidos, desde amplios hasta pequeños y apretados.' },
      { value: 'Coily', title: 'Afrorizado', desc: 'Patrón muy apretado con espirales o zig-zag, máxima retracción.' },
      { value: 'Transición', title: 'Transición capilar', desc: 'Cabello que mezcla zona natural nueva y zona con proceso químico anterior.' },
    ],
  },
  {
    id: 'curlType',
    title: 'Identifica tu subtipo de rizo',
    conditional: true,
    options: [], // se llena dinámicamente según textura
  },
  // Módulo 2 — Estructura
  {
    id: 'strandThickness',
    title: '¿Cómo es el grosor de cada mechón?',
    options: [
      { value: 'Fino', title: 'Fino', desc: 'Casi no se siente entre los dedos, parece transparente a la luz.' },
      { value: 'Medio', title: 'Medio', desc: 'Se siente claramente pero sin rigidez.' },
      { value: 'Grueso', title: 'Grueso / Coarse', desc: 'Robusto y resistente, casi como un hilo de coser.' },
    ],
  },
  {
    id: 'density',
    title: '¿Cuánto cabello tienes en total?',
    options: [
      { value: 'Escasa', title: 'Escasa', desc: 'Se ve el cuero cabelludo con facilidad.' },
      { value: 'Media', title: 'Media', desc: 'Ni demasiado poco ni demasiado.' },
      { value: 'Abundante', title: 'Abundante', desc: 'Mucho volumen, tarda en secar por dentro.' },
    ],
  },
  // Módulo 3 — Cuero cabelludo
  {
    id: 'scalp',
    title: '¿Cómo describirías tu cuero cabelludo?',
    options: [
      { value: 'Grasa', title: 'Graso', desc: 'Brillo y peso en la raíz al final del día.' },
      { value: 'Normal', title: 'Equilibrado', desc: 'Se mantiene fresco y con balance natural.' },
      { value: 'Seco', title: 'Seco', desc: 'Se siente tirante y puede picar.' },
    ],
  },
  {
    id: 'scalpIssues',
    title: '¿Tienes alguno de estos problemas?',
    multiSelect: true,
    options: [
      { value: 'caspa', title: 'Caspa / descamación', desc: 'Escamas blancas o amarillentas visibles.' },
      { value: 'picazon', title: 'Picazón o sensibilidad', desc: 'Cuero cabelludo irritado o reactivo.' },
      { value: 'caida', title: 'Caída excesiva', desc: 'Pérdida notoria al peinar o en la ducha.' },
      { value: 'ninguno', title: 'Ninguno', desc: 'Sin problemas específicos.' },
    ],
  },
  // Módulo 4 — Comportamiento
  {
    id: 'porosity',
    title: '¿Cómo absorbe tu cabello el agua?',
    options: [
      { value: 'Alta', title: 'Alta porosidad', desc: 'Absorbe rápido pero pierde hidratación fácilmente.' },
      { value: 'Media', title: 'Porosidad media', desc: 'Buena absorción y retención cuando está bien cuidado.' },
      { value: 'Baja', title: 'Baja porosidad', desc: 'Los productos tardan en penetrar y se acumulan.' },
    ],
  },
  {
    id: 'elasticity',
    title: '¿Qué pasa cuando estiras un mechón mojado?',
    options: [
      { value: 'Alta', title: 'Se estira bien', desc: 'Se alarga y regresa a su forma sin romperse.' },
      { value: 'Normal', title: 'Estiramiento normal', desc: 'Algo de estiramiento antes de romperse con fuerza.' },
      { value: 'Baja', title: 'Se rompe rápido', desc: 'Poca elasticidad, se quiebra sin casi estirarse.' },
    ],
  },
  // Módulo 5 — Historial
  {
    id: 'chemical',
    title: '¿Tu cabello tiene algún proceso químico?',
    options: [
      { value: 'Natural', title: 'Natural', desc: 'Sin procesos químicos de ningún tipo.' },
      { value: 'Color', title: 'Color / tinte', desc: 'Tinte parcial o completo, reciente o acumulado.' },
      { value: 'Alisado', title: 'Alisado / keratina', desc: 'Alisado permanente o tratamiento de keratina.' },
      { value: 'Calor', title: 'Solo calor', desc: 'Natural pero con uso frecuente de herramientas.' },
      { value: 'Varios', title: 'Varios procesos', desc: 'Combinación de color, alisado u otros tratamientos.' },
    ],
  },
  {
    id: 'heatFrequency',
    title: '¿Con qué frecuencia usas herramientas de calor?',
    options: [
      { value: 'Nunca', title: 'Nunca', desc: 'No uso plancha, secador ni rizador con calor.' },
      { value: 'Ocasional', title: 'Ocasional', desc: '1 a 2 veces por semana.' },
      { value: 'Frecuente', title: 'Frecuente', desc: '3 o más veces por semana.' },
    ],
  },
  // Módulo 6 — Longitud y objetivo
  {
    id: 'length',
    title: '¿Cuál es la longitud de tu cabello?',
    options: [
      { value: 'Corto', title: 'Corto', desc: 'Hasta cuello o hombros.' },
      { value: 'Medio', title: 'Medio', desc: 'Entre hombros y pecho.' },
      { value: 'Largo', title: 'Largo', desc: 'Debajo del pecho.' },
    ],
  },
  {
    id: 'objective',
    title: '¿Cuál es tu objetivo capilar principal?',
    options: [
      { value: 'crecimiento', title: 'Crecimiento', desc: 'Apoya el crecimiento y la fortaleza del cabello.' },
      { value: 'hidratación', title: 'Hidratación', desc: 'Aporta suavidad y flexibilidad a la fibra.' },
      { value: 'reparación', title: 'Reparación', desc: 'Repara el cabello dañado por procesos o calor.' },
      { value: 'definición', title: 'Definición', desc: 'Mejora la forma y el rebote de tus rizos u ondas.' },
      { value: 'volumen', title: 'Volumen', desc: 'Aporta cuerpo y movimiento ligero.' },
    ],
  },
  {
    id: 'photo',
    title: 'Sube una foto de tu cabello (opcional)',
    options: [],
  },
];
