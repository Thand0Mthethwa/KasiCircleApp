import { validCoordinates } from '../models/mapLocation';

// Only an explicitly approved same-origin Photon proxy is supported. No public service default.
export function placeSearchConfig(env = import.meta.env) {
  const path = env.VITE_PLACE_SEARCH_URL || '';
  const attribution = env.VITE_PLACE_SEARCH_ATTRIBUTION || '';
  const attributionUrl = env.VITE_PLACE_SEARCH_ATTRIBUTION_URL || '';
  const safePath = /^\/[a-zA-Z0-9/_-]+$/.test(path) && !path.startsWith('//');
  let safeCredit = false;
  try { const credit = new URL(attributionUrl);safeCredit = credit.protocol === 'https:' && !credit.username && !credit.password; } catch { /* incomplete configuration */ }
  return { enabled: env.VITE_PLACE_SEARCH_ENABLED === 'true' && safePath && Boolean(attribution.trim()) && safeCredit,
    path, attribution, attributionUrl };
}

export function parsePlaces(body) {
  if (!Array.isArray(body?.features)) throw new Error('Place search returned an unreadable response. Try the map instead.');
  return body.features.slice(0, 10).flatMap((feature, index) => {
    if (!Array.isArray(feature?.geometry?.coordinates)) return [];
    const [longitude, latitude] = feature.geometry.coordinates;
    if (feature?.geometry?.type !== 'Point' || !validCoordinates(latitude, longitude)) return [];
    const properties = feature.properties || {};
    const parts = [properties.name, properties.street, properties.district, properties.city, properties.state, properties.country]
      .filter(value => typeof value === 'string' && value.trim()).map(value => value.trim().slice(0, 200));
    const label = [...new Set(parts)].join(', ');
    return label ? [{ key: String(index), label, latitude, longitude }] : [];
  }).slice(0, 5);
}

export async function searchPlaces(query, { signal, config = placeSearchConfig() } = {}) {
  if (!config.enabled) throw new Error('Place search is not available. You can still choose on the map.');
  const text = query.trim();
  if (text.length < 3 || text.length > 120) throw new Error('Enter a place name between 3 and 120 letters.');
  const token = localStorage.getItem('kasicircle_token');
  let response;
  try { response = await fetch(`${config.path}?${new URLSearchParams({ q: text, limit: '5' })}`, {
    signal, cache: 'no-store', redirect: 'error', credentials: 'same-origin',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }); } catch (error) { if (signal?.aborted) throw error;throw new Error('Place search could not connect. Try again or choose on the map.'); }
  if (!response.ok) throw new Error('Place search is unavailable right now. Try again or choose on the map.');
  let body;
  try { body = await response.json(); } catch { throw new Error('Place search returned an unreadable response. Try the map instead.'); }
  return parsePlaces(body);
}
