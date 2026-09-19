import { priceTierForPrice } from '../pricing';

describe('priceTierForPrice', () => {
  it('clasifica precios bajos, medios y altos según los umbrales en COP', () => {
    expect(priceTierForPrice(20000)).toBe('low');
    expect(priceTierForPrice(35000)).toBe('low');
    expect(priceTierForPrice(60000)).toBe('mid');
    expect(priceTierForPrice(90000)).toBe('mid');
    expect(priceTierForPrice(150000)).toBe('high');
  });

  it('sin precio real (null/undefined/no numérico), cae a "mid" como antes', () => {
    expect(priceTierForPrice(null)).toBe('mid');
    expect(priceTierForPrice(undefined)).toBe('mid');
    expect(priceTierForPrice('60000')).toBe('mid');
  });
});
