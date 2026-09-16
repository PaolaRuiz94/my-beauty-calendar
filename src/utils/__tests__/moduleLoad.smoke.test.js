describe('style modules evaluate without ReferenceError', () => {
  it('DiagnosisScreen.styles.js', () => {
    expect(() => require('../../components/DiagnosisScreen.styles')).not.toThrow();
  });

  it('CalendarScreen.styles.js', () => {
    expect(() => require('../../components/CalendarScreen.styles')).not.toThrow();
  });
});

describe('modules extracted in the file-splitting refactor load without error', () => {
  // Componentes que además importan @expo/vector-icons o expo-video quedan afuera:
  // jest-expo no trae mockeadas esas fuentes/módulos nativos todavía, así que fallan
  // por gap de entorno de testing, no por bugs reales — no vale la pena un falso rojo.
  const modules = [
    '../../data/calendarContent',
    '../../data/diagnosisQuestions',
    '../../utils/hairDiagnosisEngine',
    '../../utils/routineCalendar',
    '../../components/calendar/ChipGroup',
    '../../components/calendar/YesNo',
    '../../components/calendar/ProductThumb',
  ];

  modules.forEach((m) => {
    it(m, () => {
      expect(() => require(m)).not.toThrow();
    });
  });
});
