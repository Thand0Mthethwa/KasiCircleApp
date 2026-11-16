import PlaceAttribution from './PlaceAttribution';
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { markerIcon, MapKeyboard, useMapTiles } from './mapRuntime';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, hasPublicBusinessCoordinates } from '../models/mapLocation';

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
  const tiles = useMapTiles();
  const eligible = useMemo(() => businesses.filter(hasPublicBusinessCoordinates), [businesses]);
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
    {tiles.feedback}
    <MapContainer {...initialView} minZoom={2} maxZoom={19}
      className="marketplace-map"
      scrollWheelZoom={false} keyboard={false} zoomControl={false} inertia={false} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false}>
      {tiles.layer}
      <MapKeyboard label="Interactive business locations map" />
      <MapViewport businesses={eligible} />
      <ZoomControl position="bottomleft" />
      {eligible.map(business => <Marker key={`${business.key || business.id}:${business.name}`} position={[business.latitude, business.longitude]}
        icon={markerIcon} title={business.name} alt={`Location of ${business.name}`} keyboard autoPanOnFocus={false}>
        <BusinessPopup business={business} />
      </Marker>)}
    </MapContainer>
    <PlaceAttribution />
    <p className="marketplace-map-hint">Use the zoom buttons or keyboard + / − to zoom, and arrow keys to pan. Worker locations are not plotted.</p>
  </section>;
}
