import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, hasPublicBusinessCoordinates } from '../models/mapLocation';
import '../styles/marketplace-map.css';

const markerIcon = new Icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const customUrl = import.meta.env.VITE_MAP_TILE_URL;
// Public OSM tiles are a development default only. Production must select a suitable provider.
const tileUrl = customUrl || (import.meta.env.DEV ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' : '');
const attribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || (!customUrl ? osmAttribution : '');
const tilesConfigured = Boolean(tileUrl && attribution);

function MapViewport({ businesses }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Interactive business locations map');
    container.setAttribute('tabindex', '0');
    map.invalidateSize({ animate: false });
    if (businesses.length) map.fitBounds(businesses.map(({ latitude, longitude }) => [latitude, longitude]), { padding: [36, 36], maxZoom: 15, animate: false });
    else map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { animate: false });
  }, [map, businesses]);
  useEffect(() => {
    const container = map.getContainer();
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
  }, [map]);
  return null;
}

function BusinessPopup({ business }) {
  const map = useMap();
  const frame = useRef(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const events = useMemo(() => {
    function keepVisible({ target }) {
      cancelAnimationFrame(frame.current);
      // React portals update the popup after Leaflet opens it. Measure after layout,
      // then pan immediately so reduced-motion users never get an animated jump.
      frame.current = requestAnimationFrame(() => {
        const element = target.getElement();
        if (!element?.isConnected) return;
        const viewport = map.getContainer().getBoundingClientRect();
        const popup = element.getBoundingClientRect();
        if (!popup.width || !viewport.width) return;
        const horizontal = popup.left < viewport.left + 12 ? popup.left - viewport.left - 12
          : Math.max(0, popup.right - viewport.right + 12);
        const vertical = popup.top < viewport.top + 12 ? popup.top - viewport.top - 12
          : Math.max(0, popup.bottom - viewport.bottom + 12);
        if (horizontal || vertical) map.panBy([horizontal, vertical], { animate: false });
      });
    }
    return { add: keepVisible, contentupdate: keepVisible };
  }, [map]);
  return <Popup autoPan={false} maxHeight={240} eventHandlers={events}>
    <h3 className="marketplace-map-business-name">{business.name}</h3>
    <p>{business.category}</p>
    <p>{[business.address, business.city, business.province].filter(Boolean).join(', ')}</p>
    <Link className="marketplace-map-details" to={`/businesses/${encodeURIComponent(business.id)}`} aria-label={`View details for ${business.name}`}>View business details</Link>
  </Popup>;
}

export default function MarketplaceMap({ businesses = [], page = 0, onListView }) {
  const eligible = useMemo(() => businesses.filter(hasPublicBusinessCoordinates), [businesses]);
  const [tileError, setTileError] = useState(false);
  const [loading, setLoading] = useState(tilesConfigured);
  const [tileAttempt, setTileAttempt] = useState(0);
  const tileEvents = useMemo(() => ({ loading: () => setLoading(true), load: () => setLoading(false), tileerror: () => setTileError(true) }), []);

  const initialView = eligible.length
    ? { bounds: eligible.map(({ latitude, longitude }) => [latitude, longitude]), boundsOptions: { padding: [36, 36], maxZoom: 15, animate: false } }
    : { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM };

  return <section className="marketplace-map-panel" aria-label="Business map view">
    <div className="marketplace-map-summary">
      <p className="font-semibold" role="status">Showing {eligible.length} {eligible.length === 1 ? 'business pin' : 'business pins'} from the current business page (page {page + 1}).</p>
      <p>This map covers only the businesses loaded on this page, not all matching results. Use Business pages below to see more.</p>
      {businesses.length > eligible.length && <p>{businesses.length - eligible.length} {businesses.length - eligible.length === 1 ? 'business on this page has' : 'businesses on this page have'} no valid public map location. They remain available in List View.</p>}
      {!eligible.length && <div className="marketplace-map-empty">
        <h3>Precise business locations are not available on this page yet.</h3>
        <p>Addresses and township names are not exact map pins. Browse List View for all businesses on this page.</p>
      </div>}
      <button type="button" className="marketplace-map-list-link" onClick={onListView}>Browse List View</button>
    </div>
    {!tilesConfigured && <p role="status" className="marketplace-map-message">Map tiles are not configured. Business pins and List View remain available.</p>}
    {tilesConfigured && loading && !tileError && <p role="status" className="marketplace-map-message">Loading map tiles…</p>}
    {tileError && <div role="alert" className="marketplace-map-message">
      <p>Some map tiles could not load. Business pins and List View remain available.</p>
      <button type="button" className="marketplace-map-list-link" onClick={() => { setTileError(false); setLoading(true); setTileAttempt(value => value + 1); }}>Retry map tiles</button>
    </div>}
    <MapContainer {...initialView} minZoom={2} maxZoom={19}
      className="marketplace-map"
      scrollWheelZoom={false} keyboard={false} zoomControl={false} inertia={false} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false}>
      {tilesConfigured && <TileLayer key={tileAttempt} url={tileUrl} attribution={attribution}
        maxZoom={19} keepBuffer={0} updateWhenIdle eventHandlers={tileEvents} referrerPolicy="strict-origin-when-cross-origin" />}
      <MapViewport businesses={eligible} />
      <ZoomControl position="bottomleft" />
      {eligible.map(business => <Marker key={`${business.key || business.id}:${business.name}`} position={[business.latitude, business.longitude]}
        icon={markerIcon} title={business.name} alt={`Location of ${business.name}`} keyboard autoPanOnFocus={false}>
        <BusinessPopup business={business} />
      </Marker>)}
    </MapContainer>
    <p className="marketplace-map-hint">Use the zoom buttons or keyboard + / − to zoom, and arrow keys to pan. Worker locations are not plotted.</p>
  </section>;
}
