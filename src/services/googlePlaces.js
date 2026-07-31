const BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const KEY  = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

// Keywords separados — la API los trata como frase, no como OR
const CURLY_KEYWORDS = ['rizos', 'crespo', 'crespa', 'curly', 'afro'];

const CURLY_RE = /rizo|afro|curly|natural|ondula|coily|cresp/i;

function inferTipo(place) {
  return CURLY_RE.test(place.name) ? 'Para rizadas' : 'Tradicional';
}

export function normalize(place) {
  return {
    id:            place.place_id,
    nombre:        place.name,
    direccion:     place.vicinity,
    lat:           place.geometry.location.lat,
    lng:           place.geometry.location.lng,
    rating:        place.rating          ?? 0,
    totalResenias: place.user_ratings_total ?? 0,
    tipo:          inferTipo(place),
    telefono:      null,
    horarios:      null,
    openNow:       place.opening_hours?.open_now ?? null,
    isGooglePlace: true,
    photoRef:      place.photos?.[0]?.photo_reference ?? null,
  };
}

async function fetchOnce(lat, lng, radiusKm, keyword) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius:   String(radiusKm * 1000),
    type:     'hair_care',
    language: 'es',
    key:      KEY,
  });
  if (keyword) params.set('keyword', keyword);

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error('Error de red');
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(data.status);
  return (data.results || []).filter(p =>
    p.business_status !== 'PERMANENTLY_CLOSED' && !p.permanently_closed
  );
}

export async function searchNearbySalons(lat, lng, { tipo = 'Todas', radiusKm = 5 } = {}) {
  if (!KEY) throw new Error('EXPO_PUBLIC_GOOGLE_PLACES_KEY no configurada');

  let raw = [];

  if (tipo === 'Para rizadas') {
    // Búsqueda paralela con cada keyword y combinamos sin duplicados
    const results = await Promise.all(
      CURLY_KEYWORDS.map(kw => fetchOnce(lat, lng, radiusKm, kw).catch(() => []))
    );
    const seen = new Set();
    for (const batch of results) {
      for (const place of batch) {
        if (!seen.has(place.place_id)) {
          seen.add(place.place_id);
          raw.push(place);
        }
      }
    }
  } else {
    raw = await fetchOnce(lat, lng, radiusKm, null);
  }

  const places = raw.map(normalize);

  // Para rizadas: solo las que tienen keyword de rizos/crespo en el nombre
  if (tipo === 'Para rizadas') {
    return places
      .filter(p => p.tipo === 'Para rizadas')
      .sort((a, b) => b.rating - a.rating);
  }

  return places.sort((a, b) => b.rating - a.rating);
}

export function mapsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.nombre)}&query_place_id=${place.id}`;
}
