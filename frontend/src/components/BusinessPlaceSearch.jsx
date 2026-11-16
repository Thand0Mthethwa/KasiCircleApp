import { useEffect, useRef, useState } from 'react';
import { placeSearchStatus, searchPlaces } from '../services/placeSearch';
import { Button } from './index';
import PlaceAttribution from './PlaceAttribution';
export default function BusinessPlaceSearch({ onSelect, disabled }) {
  const [available, setAvailable] = useState(null);
  const [query, setQuery] = useState(''), [results, setResults] = useState([]), [loading, setLoading] = useState(false), [message, setMessage] = useState('');
  const request = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    placeSearchStatus(controller.signal).then(enabled => { if (!controller.signal.aborted) setAvailable(enabled); })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => { controller.abort();request.current?.abort(); };
  }, []);
  async function search() {
    if (disabled || loading || available !== true) return;
    request.current?.abort();const controller = new AbortController();request.current = controller;
    setResults([]);setLoading(true);setMessage('');
    try {
      const places = await searchPlaces(query, { signal: controller.signal });
      if (!controller.signal.aborted) { setResults(places);if (!places.length) setMessage('No places found. Try a nearby landmark or choose on the map.'); }
    } catch (error) { if (!controller.signal.aborted) setMessage(error.message || 'Place search is unavailable. Choose on the map instead.'); }
    finally { if (request.current === controller) setLoading(false); }
  }
  return <section className="location-place-search" aria-label="Search for a place">
    <label htmlFor="business-place-search">Search for a place</label>
    <p id="business-place-help">Try a township, street, shopping centre, taxi rank, school or nearby landmark.</p>
    <div className="location-search-row"><input id="business-place-search" type="search" className="input-field" value={query}
      onChange={event => { request.current?.abort();setQuery(event.target.value);setResults([]);setMessage('');setLoading(false); }}
      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault();search(); } }}
      aria-describedby="business-place-help" maxLength={120} />
      <Button type="button" variant="secondary" disabled={available !== true || disabled || loading} onClick={search}>{loading ? 'Searching…' : 'Search places'}</Button></div>
    {available === null && <p role="status">Checking online place search… You can type a place name now.</p>}
    {available === false && <p role="status">Online place search is temporarily unavailable. You can still use the map or your current location.</p>}
    {loading && <p role="status">Looking for places…</p>}
    {message && <p role="status">{message}</p>}
    {results.length > 0 && <><p>Choose an area, then mark your business on the map. A search result is not your confirmed business pin.</p>
      <ul className="location-place-results" aria-label="Places found">{results.map(place => <li key={place.key}><button type="button" disabled={disabled} onClick={() => onSelect(place)}>{place.name && <strong>{place.name}<br /></strong>}{place.label}</button>{place.attribution && <small>{place.attribution}</small>}</li>)}</ul></>}
    <PlaceAttribution />
  </section>;
}
