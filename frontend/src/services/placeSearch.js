import { validCoordinates } from '../models/mapLocation';
const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
const unavailable = 'Online place search is temporarily unavailable. You can still use the map or your current location.';
async function request(path, signal) {
  const token = localStorage.getItem('kasicircle_token');
  let response;
  try {
    response = await fetch(`${base}/api/places/${path}`, { signal, cache: 'no-store', redirect: 'error',
      headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (error) { if (signal?.aborted) throw error;throw new Error(unavailable); }
  if (!response.ok) throw new Error(response.status === 429 ? 'Place search is busy. Please wait a minute and try again.' : unavailable);
  try { return await response.json(); } catch { throw new Error(unavailable); }
}
export async function placeSearchStatus(signal) {
  const body = await request('status', signal);
  return body.enabled === true;
}
export function parsePlaces(body) {
  if (!Array.isArray(body?.places)) throw new Error(unavailable);
  return body.places.slice(0, 5).flatMap((place, index) => {
    if (!validCoordinates(place?.latitude, place?.longitude) || typeof place?.formattedAddress !== 'string' || !place.formattedAddress.trim()) return [];
    return [{ key: String(index), name: typeof place.name === 'string' ? place.name.slice(0, 160) : '',
      label: place.formattedAddress.slice(0, 400), latitude: place.latitude, longitude: place.longitude,
      attribution: typeof place.attribution === 'string' ? place.attribution.slice(0, 300) : '' }];
  });
}
export async function searchPlaces(query, { signal } = {}) {
  const text = query.trim();
  if (text.length < 3 || text.length > 120 || Array.from(text).some(character => { const code = character.codePointAt(0);return code < 32 || (code >= 127 && code <= 159); })) throw new Error('Enter a place name between 3 and 120 characters.');
  return parsePlaces(await request(`search?${new URLSearchParams({ q: text })}`, signal));
}
