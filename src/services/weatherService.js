import * as Location from 'expo-location';

// Obtén tu API key gratuita en https://openweathermap.org/api → "Current Weather Data"
const OPENWEATHER_API_KEY = 'REDACTED';

export async function getWeatherContext() {
  let { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    const result = await Location.requestForegroundPermissionsAsync();
    status = result.status;
  }
  if (status !== 'granted') return null;

  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  const { latitude, longitude } = loc.coords;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`
  );
  if (!res.ok) return null;
  const data = await res.json();

  const temp     = data.main.temp;
  const humidity = data.main.humidity;
  const condition = data.weather[0].main; // 'Rain', 'Clear', 'Clouds', etc.
  const city     = data.name;
  const icon     = data.weather[0].icon;

  const flags = [];
  if (humidity > 70)    flags.push('highHumidity');
  else if (humidity < 40) flags.push('dryClimate');
  if (temp > 28)        flags.push('hotWeather');
  else if (temp < 10)   flags.push('coldWeather');
  if (condition === 'Rain' || condition === 'Drizzle') flags.push('rainyWeather');

  return { city, temp: Math.round(temp), humidity, condition, icon, flags };
}

// Tags de productos que se benefician según el clima
export function getWeatherBoostTags(weatherFlags = []) {
  const boost = [];
  if (weatherFlags.includes('highHumidity') || weatherFlags.includes('rainyWeather'))
    boost.push('anti-frizz', 'control', 'gel', 'sellado', 'fijación');
  if (weatherFlags.includes('dryClimate') || weatherFlags.includes('coldWeather'))
    boost.push('hidratación', 'aceite', 'nutritivo', 'intensivo', 'humectante');
  if (weatherFlags.includes('hotWeather'))
    boost.push('ligero', 'protector', 'refrescante', 'sin sulfatos');
  return boost;
}

// Texto descriptivo para el banner
export function getWeatherHairTip(weatherFlags = []) {
  if (weatherFlags.includes('highHumidity') || weatherFlags.includes('rainyWeather'))
    return 'Humedad alta · Prioriza productos anti-frizz y sellado';
  if (weatherFlags.includes('dryClimate'))
    return 'Ambiente seco · Tu cabello necesita más hidratación hoy';
  if (weatherFlags.includes('coldWeather'))
    return 'Clima frío · Opta por aceites y cremas nutritivas';
  if (weatherFlags.includes('hotWeather'))
    return 'Calor intenso · Usa productos ligeros y protector térmico';
  return 'Clima ideal para tu rutina capilar ✨';
}
