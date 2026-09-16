jest.mock('../../data/products', () => ({
  amazonProductCatalog: [
    { id: 'p1', brand: 'Gisou', name: 'Honey Infused Shampoo', asin: 'B001AAAAAA' },
    { id: 'p2', brand: 'Olaplex', name: 'No.3', asin: 'B002BBBBBB', amazonLink: 'https://www.amazon.com/dp/B002BBBBBB?tag=custom-20' },
  ],
  getAmazonProductById: (id) =>
    ({
      p1: { id: 'p1', brand: 'Gisou', name: 'Honey Infused Shampoo', asin: 'B001AAAAAA' },
      p2: { id: 'p2', brand: 'Olaplex', name: 'No.3', asin: 'B002BBBBBB', amazonLink: 'https://www.amazon.com/dp/B002BBBBBB?tag=custom-20' },
    }[id]) || null,
}));

const { normalizeText, getProductAsin, buildAmazonUrl, buildCartUrl, AFFILIATE_TAG } = require('../amazonUtils');

describe('normalizeText', () => {
  it('pasa a minúsculas y sacas tildes', () => {
    expect(normalizeText('Aceite Hidratación')).toBe('aceitehidratacion');
  });

  it('elimina espacios y símbolos', () => {
    expect(normalizeText('No. 3 - Hair Perfector')).toBe('no3hairperfector');
  });

  it('con valor vacío no explota', () => {
    expect(normalizeText()).toBe('');
  });
});

describe('getProductAsin', () => {
  it('encuentra el asin por id directo', () => {
    expect(getProductAsin({ id: 'p1' })).toBe('B001AAAAAA');
  });

  it('encuentra el asin por brand+name si no hay match por id', () => {
    expect(getProductAsin({ brand: 'gisou', name: 'honey infused shampoo' })).toBe('B001AAAAAA');
  });

  it('cae al asin propio del producto si no está en el catálogo', () => {
    expect(getProductAsin({ id: 'noexiste', asin: 'B999ZZZZZZ' })).toBe('B999ZZZZZZ');
  });

  it('devuelve null si no hay ningún match', () => {
    expect(getProductAsin({ id: 'noexiste', brand: 'X', name: 'Y' })).toBeNull();
  });
});

describe('buildAmazonUrl', () => {
  it('prioriza el amazonLink verificado del producto', () => {
    expect(buildAmazonUrl({ amazonLink: 'https://www.amazon.com/dp/CUSTOM' })).toBe(
      'https://www.amazon.com/dp/CUSTOM'
    );
  });

  it('usa el amazonLink del catálogo si el producto no trae el suyo', () => {
    expect(buildAmazonUrl({ id: 'p2' })).toBe('https://www.amazon.com/dp/B002BBBBBB?tag=custom-20');
  });

  it('arma la url con el asin del catálogo y el affiliate tag por defecto', () => {
    expect(buildAmazonUrl({ id: 'p1' })).toBe(`https://www.amazon.com/dp/B001AAAAAA?tag=${AFFILIATE_TAG}`);
  });

  it('devuelve null si no hay ningún dato para armar el link', () => {
    expect(buildAmazonUrl({ id: 'noexiste' })).toBeNull();
  });
});

describe('buildCartUrl', () => {
  it('arma la url del carrito con todos los asins encontrados', () => {
    const url = buildCartUrl([{ id: 'p1' }, { id: 'p2' }]);
    expect(url).toContain(`AssociateTag=${AFFILIATE_TAG}`);
    expect(url).toContain('ASIN.1=B001AAAAAA');
    expect(url).toContain('ASIN.2=B002BBBBBB');
  });

  it('devuelve null si ningún producto tiene asin', () => {
    expect(buildCartUrl([{ id: 'noexiste' }])).toBeNull();
  });
});
