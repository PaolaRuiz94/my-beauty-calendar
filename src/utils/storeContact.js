// storeContact.js — contactar a una tienda/peluquería por WhatsApp para comprar
// productos de su catálogo propio (no tienen carrito online, a diferencia de
// Amazon). El teléfono viene con formato inconsistente según cómo se cargó
// (peluquerías curadas a mano: "3001234567"; tiendas registradas desde el
// panel de empresas: texto libre tipo "+57 300 123 4567"), así que siempre
// normalizamos antes de armar el link.

export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `57${digits}`; // local sin código de país
  if (digits.startsWith('57') && digits.length >= 11) return digits; // ya lo incluye
  return digits;
}

export function buildOrderMessage(storeName, items) {
  const lines = items.map((p) => {
    const qty = p.quantity && p.quantity > 1 ? `${p.quantity}x ` : '';
    const brand = p.brand ? `${p.brand} — ` : '';
    const price = typeof p.price === 'number' ? ` ($${p.price.toLocaleString('es-CO')} COP)` : '';
    return `• ${qty}${brand}${p.name}${price}`;
  });
  return `Hola! Quisiera comprar estos productos de ${storeName}:\n\n${lines.join('\n')}`;
}

export function buildWhatsAppUrl(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const text = message ? `&text=${encodeURIComponent(message)}` : '';
  return `whatsapp://send?phone=${normalized}${text}`;
}
