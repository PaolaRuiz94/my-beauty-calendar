import { getAmazonProductById, amazonProductCatalog } from '../data/products';

export const AFFILIATE_TAG = 'mybeautycalendar-20';

export function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function getProductAsin(product) {
  const direct = product?.id ? getAmazonProductById(product.id) : null;
  const byName =
    !direct && product?.brand && product?.name
      ? amazonProductCatalog.find(
          e =>
            normalizeText(e?.brand) === normalizeText(product.brand) &&
            normalizeText(e?.name) === normalizeText(product.name)
        ) || null
      : null;
  const entry = direct || byName;
  return entry?.asin || product?.asin || null;
}

export function buildAmazonUrl(product) {
  // Link directo verificado por el usuario tiene prioridad
  if (product?.amazonLink) return product.amazonLink;

  const direct = product?.id ? getAmazonProductById(product.id) : null;
  const byName =
    !direct && product?.brand && product?.name
      ? amazonProductCatalog.find(
          e =>
            normalizeText(e?.brand) === normalizeText(product.brand) &&
            normalizeText(e?.name) === normalizeText(product.name)
        ) || null
      : null;
  const entry = direct || byName;

  if (entry?.amazonLink) return entry.amazonLink;
  if (entry?.asin) return `https://www.amazon.com/dp/${entry.asin}?tag=${AFFILIATE_TAG}`;
  if (product?.asin) return `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`;
  return null;
}

export function buildCartUrl(products) {
  const asins = products.map(getProductAsin).filter(Boolean);
  if (asins.length === 0) return null;
  const params = asins
    .map((asin, i) => `ASIN.${i + 1}=${asin}&Quantity.${i + 1}=1`)
    .join('&');
  return `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${AFFILIATE_TAG}&${params}`;
}
