import { getPrimaryNeed, getTreatmentOrder, getRoutinePlan, getRecommendedProducts, buildHairProfile } from '../hairDiagnosisEngine';

describe('getPrimaryNeed', () => {
  test('baja elasticidad prioriza reconstrucción, incluso con porosidad alta', () => {
    expect(getPrimaryNeed({ lowElasticity: true, highPorosity: true, lowPorosity: false, needsProtein: true }).key)
      .toBe('reconstruccion');
  });

  test('porosidad alta sin baja elasticidad da hidratación', () => {
    expect(getPrimaryNeed({ lowElasticity: false, highPorosity: true, lowPorosity: false, needsProtein: false }).key)
      .toBe('hidratacion');
  });

  test('porosidad baja sin baja elasticidad da nutrición', () => {
    expect(getPrimaryNeed({ lowElasticity: false, highPorosity: false, lowPorosity: true, needsProtein: false }).key)
      .toBe('nutricion');
  });

  test('sin señales de porosidad/elasticidad pero con needsProtein da reconstrucción', () => {
    expect(getPrimaryNeed({ lowElasticity: false, highPorosity: false, lowPorosity: false, needsProtein: true }).key)
      .toBe('reconstruccion');
  });

  test('perfil sin señales fuertes cae en hidratación por defecto', () => {
    expect(getPrimaryNeed({ lowElasticity: false, highPorosity: false, lowPorosity: false, needsProtein: false }).key)
      .toBe('hidratacion');
  });
});

describe('getTreatmentOrder', () => {
  test('pone el tratamiento de la necesidad principal primero', () => {
    expect(getTreatmentOrder({ lowElasticity: true, highPorosity: false, lowPorosity: false, needsProtein: false })[0])
      .toBe('reconstructor');
    expect(getTreatmentOrder({ lowElasticity: false, highPorosity: true, lowPorosity: false, needsProtein: false })[0])
      .toBe('hidratante');
    expect(getTreatmentOrder({ lowElasticity: false, highPorosity: false, lowPorosity: true, needsProtein: false })[0])
      .toBe('nutritivo');
  });

  test('siempre incluye los 3 tratamientos sin repetir', () => {
    const order = getTreatmentOrder({ lowElasticity: true, highPorosity: false, lowPorosity: false, needsProtein: false });
    expect(new Set(order)).toEqual(new Set(['nutritivo', 'reconstructor', 'hidratante']));
  });
});

describe('getRoutinePlan — orden de lavados según diagnóstico', () => {
  const baseAnswers = {
    scalp: 'Normal', porosity: 'Media', density: 'Media', chemical: 'Natural',
    texture: 'Rizado', objective: 'reparación', curlType: 'Rizo definido',
    strandThickness: 'Medio', elasticity: 'Baja', scalpIssues: [],
    heatFrequency: 'Ocasional', length: 'Medio',
  };

  test('diagnóstico de reconstrucción (elasticidad baja) pone el lavado A como reconstructor', () => {
    const profile = buildHairProfile(baseAnswers);
    expect(getPrimaryNeed(profile).key).toBe('reconstruccion');
    const plan = getRoutinePlan(profile, { products: [], treatments: {} });
    expect(plan[0].title).toContain('Reconstructor');
    const treatmentStep = plan[0].daySteps.find(s => s.category === 'Tratamiento');
    expect(treatmentStep.displayLabel).toBe('Tratamiento reconstructor');
  });

  test('diagnóstico de hidratación (porosidad alta) pone el lavado A como hidratante', () => {
    const profile = buildHairProfile({ ...baseAnswers, elasticity: 'Alta', porosity: 'Alta' });
    expect(getPrimaryNeed(profile).key).toBe('hidratacion');
    const plan = getRoutinePlan(profile, { products: [], treatments: {} });
    expect(plan[0].title).toContain('Hidratante');
  });
});

describe('getRecommendedProducts — variedad de tratamientos con catálogo de tienda limitado', () => {
  const answers = {
    scalp: 'Normal', porosity: 'Media', density: 'Media', chemical: 'Natural',
    texture: 'Rizado', objective: 'reparación', curlType: 'Rizo definido',
    strandThickness: 'Medio', elasticity: 'Media', scalpIssues: [],
    heatFrequency: 'Ocasional', length: 'Medio',
  };

  test('con solo 1 producto de tratamiento en la tienda, los 3 tratamientos no colapsan en el mismo producto', () => {
    const profile = buildHairProfile(answers);
    const storeProductDB = {
      tratamiento: [{
        id: 'tienda-unico', brand: 'MarcaTienda', name: 'Único tratamiento de la tienda',
        category: 'Tratamiento', tags: ['hidratante'],
      }],
    };
    const { treatments } = getRecommendedProducts(profile, storeProductDB);
    const ids = [treatments.nutritivo?.id, treatments.reparador?.id, treatments.hidratante?.id];
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBeGreaterThan(1);
  });
});
