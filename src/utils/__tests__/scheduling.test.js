import {
  dayKeyFor,
  slotsForDuration,
  slotIdsFor,
  normalizeHorarioDay,
  availableStartTimes,
} from '../scheduling';

describe('dayKeyFor', () => {
  it('mapea la fecha al día de la semana en español sin tilde', () => {
    // 2026-09-16 es miércoles
    expect(dayKeyFor('2026-09-16')).toBe('miercoles');
    // 2026-09-14 es lunes
    expect(dayKeyFor('2026-09-14')).toBe('lunes');
  });
});

describe('slotsForDuration', () => {
  it('redondea hacia arriba al múltiplo de 15 más cercano', () => {
    expect(slotsForDuration(15)).toBe(1);
    expect(slotsForDuration(20)).toBe(2);
    expect(slotsForDuration(30)).toBe(2);
    expect(slotsForDuration(45)).toBe(3);
  });

  it('nunca devuelve menos de 1 slot', () => {
    expect(slotsForDuration(0)).toBe(1);
    expect(slotsForDuration(null)).toBe(1);
  });
});

describe('slotIdsFor', () => {
  it('arma los ids consecutivos que ocupa el servicio', () => {
    expect(slotIdsFor('2026-09-16', '09:00', 30)).toEqual([
      '2026-09-16_09:00',
      '2026-09-16_09:15',
    ]);
  });

  it('un servicio de 15 min ocupa un solo slot', () => {
    expect(slotIdsFor('2026-09-16', '10:00', 15)).toEqual(['2026-09-16_10:00']);
  });
});

describe('normalizeHorarioDay', () => {
  it('deja pasar el formato nuevo (array) tal cual', () => {
    const rangos = [{ inicio: '09:00', fin: '18:00' }];
    expect(normalizeHorarioDay(rangos)).toEqual(rangos);
  });

  it('convierte el formato viejo ({activo, abre, cierra}) a array', () => {
    expect(normalizeHorarioDay({ activo: true, abre: '09:00', cierra: '18:00' }))
      .toEqual([{ inicio: '09:00', fin: '18:00' }]);
  });

  it('devuelve vacío si el día está cerrado (activo: false) o es null', () => {
    expect(normalizeHorarioDay({ activo: false, abre: '09:00', cierra: '18:00' })).toEqual([]);
    expect(normalizeHorarioDay(null)).toEqual([]);
    expect(normalizeHorarioDay(undefined)).toEqual([]);
  });
});

describe('availableStartTimes', () => {
  const rangos = [{ inicio: '09:00', fin: '10:00' }];

  it('genera todos los horarios de inicio posibles cada 15 min', () => {
    // servicio de 15 min en un rango de 09:00 a 10:00 -> arranca en 09:00..09:45
    expect(availableStartTimes(rangos, 15, new Set())).toEqual([
      '09:00', '09:15', '09:30', '09:45',
    ]);
  });

  it('un servicio más largo deja de ofrecer horarios cerca del cierre', () => {
    // 30 min en un rango de 1 hora -> el último inicio posible es 09:30 (termina 10:00 justo)
    expect(availableStartTimes(rangos, 30, new Set())).toEqual([
      '09:00', '09:15', '09:30',
    ]);
  });

  it('excluye horarios que chocan con slots ya ocupados', () => {
    const occupied = new Set(['09:15']);
    // servicio de 15 min: 09:15 queda ocupado, el resto libre
    expect(availableStartTimes(rangos, 15, occupied)).toEqual([
      '09:00', '09:30', '09:45',
    ]);
  });

  it('un servicio de 30 min no puede empezar si pisaría un slot ocupado más adelante', () => {
    const occupied = new Set(['09:30']);
    // 09:15-09:45 pisaría el slot ocupado de 09:30 -> se excluye
    expect(availableStartTimes(rangos, 30, occupied)).toEqual([
      '09:00',
    ]);
  });

  it('sin rangos ese día, no hay horarios disponibles', () => {
    expect(availableStartTimes([], 15, new Set())).toEqual([]);
    expect(availableStartTimes(null, 15, new Set())).toEqual([]);
  });
});
