// pricing.js — clasificación de precio real en tiers económico/medio/premium.

// Umbrales de precio (COP) para clasificar productos de tienda en el mismo
// tier económico/balanceado/premium que ya usan los productos de Amazon
// (ver PRICE_TIER_BY_BRAND en data/products.js). Son un punto de partida
// razonable para cuidado capilar en Colombia — ajustables acá si con más
// tiendas reales la distribución de precios pide otro corte.
const PRICE_TIER_THRESHOLDS_COP = { low: 35000, high: 90000 };

export function priceTierForPrice(price) {
  if (typeof price !== 'number') return 'mid';
  if (price <= PRICE_TIER_THRESHOLDS_COP.low) return 'low';
  if (price <= PRICE_TIER_THRESHOLDS_COP.high) return 'mid';
  return 'high';
}
