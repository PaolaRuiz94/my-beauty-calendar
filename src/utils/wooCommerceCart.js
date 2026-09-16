// wooCommerceCart.js — armar URLs de "agregar al carrito" para tiendas con
// e-commerce propio en WooCommerce (confirmado que funciona sin login: cada
// URL con ?add-to-cart=ID se acumula en la misma sesión del navegador, no
// se pisan entre sí). Cada producto necesita su externalProductId real de
// WooCommerce guardado del lado de la tienda — sin eso no se puede armar el
// link y hay que caer al fallback de WhatsApp.

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

export function buildAddToCartUrl(website, externalProductId, quantity = 1) {
  if (!website || !externalProductId) return null;
  return `${stripTrailingSlash(website)}/?add-to-cart=${encodeURIComponent(externalProductId)}&quantity=${quantity}`;
}

// cartPath es configurable porque cada sitio WooCommerce puede tener la
// página de carrito en una ruta distinta (Palatsi usa "/carrito/", el default
// en inglés de WooCommerce es "/cart/").
export function buildCartPageUrl(website, cartPath = '/carrito/') {
  if (!website) return null;
  return `${stripTrailingSlash(website)}${cartPath}`;
}
