import { haversineKm } from '../geo';

describe('haversineKm', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineKm(4.6, -74.1, 4.6, -74.1)).toBe(0);
  });

  it('calcula una distancia razonable entre Bogotá y Medellín (~240 km)', () => {
    const km = haversineKm(4.7110, -74.0721, 6.2442, -75.5812);
    expect(km).toBeGreaterThan(230);
    expect(km).toBeLessThan(250);
  });
});
