// Shared by lazy-loaded public map and owner picker; never imported by the default list.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from 'leaflet';
import { TileLayer, useMap } from 'react-leaflet';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import '../styles/marketplace-map.css';

export const markerIcon = new Icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const customUrl = import.meta.env.VITE_MAP_TILE_URL;
const tileUrl = customUrl || (import.meta.env.DEV ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : '');
const attribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || (!customUrl ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : '');
const configured = Boolean(tileUrl && attribution);

export function MapKeyboard({ label }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute('role', 'region');container.setAttribute('aria-label', label);container.setAttribute('tabindex', '0');
    function navigate(event) {
      if (event.target !== container || event.altKey || event.ctrlKey || event.metaKey) return;
      const pans = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] };
      if (pans[event.key]) map.panBy(pans[event.key].map(value => value * (event.shiftKey ? 3 : 1)), { animate: false });
      else if (event.key === '+' || event.key === '=') map.zoomIn(1, { animate: false });
      else if (event.key === '-') map.zoomOut(1, { animate: false });
      else return;
      event.preventDefault();
    }
    container.addEventListener('keydown', navigate);
    return () => container.removeEventListener('keydown', navigate);
  }, [map, label]);
  return null;
}

export function useMapTiles(fallback = 'Business pins and List View remain available.') {
  const [error, setError] = useState(false), [loading, setLoading] = useState(configured), [attempt, setAttempt] = useState(0);
  const events = useMemo(() => ({ loading: () => setLoading(true), load: () => setLoading(false), tileerror: () => setError(true) }), []);
  const feedback = <>
    {!configured && <p role="status" className="marketplace-map-message">The map background is unavailable. {fallback}</p>}
    {configured && loading && !error && <p role="status" className="marketplace-map-message">Loading map tiles…</p>}
    {error && <div role="alert" className="marketplace-map-message"><p>Some map tiles could not load. {fallback}</p>
      <button type="button" className="marketplace-map-list-link" onClick={() => { setError(false);setLoading(true);setAttempt(value => value + 1); }}>Retry map tiles</button></div>}
  </>;
  return { feedback, layer: configured ? <TileLayer key={attempt} url={tileUrl} attribution={attribution} maxZoom={19} keepBuffer={0} updateWhenIdle eventHandlers={events} referrerPolicy="strict-origin-when-cross-origin" /> : null };
}
