import {
  scoreProductForProfile,
  getMatchingProducts,
  getMatchingProductsByFlags,
  CATEGORY_KEY,
} from '../productScoring';

describe('scoreProductForProfile', () => {
  it('sube el puntaje cuando el tag del producto matchea el objetivo del perfil', () => {
    const product = { tags: ['Hidratante', 'Nutritivo'] };
    const profile = { objective: 'hidratación' };
    expect(scoreProductForProfile(product, 'shampoo', profile)).toBeGreaterThan(0);
  });

  it('devuelve 0 cuando el perfil no tiene ningún flag activo', () => {
    const product = { tags: ['Hidratante'] };
    expect(scoreProductForProfile(product, 'shampoo', {})).toBe(0);
  });

  it('penaliza un shampoo reparador para cuero cabelludo graso', () => {
    const product = { tags: ['Reparador'] };
    const profile = { scalp: 'Grasa' };
    expect(scoreProductForProfile(product, 'shampoo', profile)).toBeLessThan(0);
  });

  it('penaliza estilizadores pesados para cabello lacio', () => {
    const product = { tags: [], weightClass: 'pesado' };
    const profile = { texture: 'Lacio', isLacio: true };
    const score = scoreProductForProfile(product, 'gel', profile);
    expect(score).toBeLessThan(0);
  });

  it('premia estilizadores pesados para cabello rizado/coily', () => {
    const product = { tags: [], weightClass: 'pesado' };
    const profile = { isCoily: true };
    const score = scoreProductForProfile(product, 'gel', profile);
    expect(score).toBeGreaterThan(0);
  });

  it('no explota si el producto no tiene tags', () => {
    const product = {};
    const profile = { isChemical: true };
    expect(() => scoreProductForProfile(product, 'shampoo', profile)).not.toThrow();
  });
});

describe('getMatchingProducts', () => {
  const products = [
    { id: 1, category: 'Shampoo', tags: ['Hidratante'] },
    { id: 2, category: 'Shampoo', tags: ['Clarificante'] },
    { id: 3, category: 'Gel', tags: [] },
  ];

  it('filtra solo los productos de la categoría pedida', () => {
    const result = getMatchingProducts(products, 'Shampoo', null);
    expect(result.every((p) => p.category === 'Shampoo')).toBe(true);
  });

  it('sin perfil, devuelve la categoría completa sin filtrar', () => {
    const result = getMatchingProducts(products, 'Shampoo', null);
    expect(result).toHaveLength(2);
  });

  it('con perfil, ordena primero los productos con score positivo', () => {
    const profile = { objective: 'hidratación' };
    const result = getMatchingProducts(products, 'Shampoo', profile);
    expect(result[0].id).toBe(1);
  });

  it('si ningún producto matchea el perfil, devuelve la categoría completa igual', () => {
    const profile = { objective: 'volumen' };
    const result = getMatchingProducts(products, 'Shampoo', profile);
    expect(result).toHaveLength(2);
  });
});

describe('getMatchingProductsByFlags', () => {
  const products = [
    { id: 1, category: 'Shampoo', tags: ['Hidratante'] },
    { id: 2, category: 'Gel', tags: [] },
  ];

  it('sin flags, devuelve todos los productos', () => {
    expect(getMatchingProductsByFlags(products, [])).toEqual(products);
  });

  it('con flags, filtra por score positivo usando CATEGORY_KEY', () => {
    const result = getMatchingProductsByFlags(products, ['dryScalp']);
    expect(result.map((p) => p.id)).toEqual([1]);
  });
});

describe('CATEGORY_KEY', () => {
  it('mapea las etiquetas del catálogo a las claves internas', () => {
    expect(CATEGORY_KEY['Crema de Peinar']).toBe('cremaDePeinar');
    expect(CATEGORY_KEY['Tónico']).toBe('tonico');
  });
});
