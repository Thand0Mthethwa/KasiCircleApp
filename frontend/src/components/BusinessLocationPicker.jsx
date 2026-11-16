import { useEffect } from 'react';
import { MapContainer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../models/mapLocation';
import { markerIcon, MapKeyboard, useMapTiles } from './mapRuntime';

function Placement({ position, onChange, disabled }) {
  const map = useMap();
  useMapEvents({ click: event => { if (!disabled) onChange(event.latlng.wrap().lat, event.latlng.wrap().lng); } });
  useEffect(() => { if (position) map.setView(position, Math.max(map.getZoom(), 13), { animate: false }); }, [map, position]);
  return position ? <Marker position={position} icon={markerIcon} draggable={!disabled} keyboard alt="Selected business location" title="Drag to move the business location"
    eventHandlers={{ dragend: event => { if (!disabled) { const point = event.target.getLatLng().wrap();onChange(point.lat, point.lng); } } }} /> : null;
}

export default function BusinessLocationPicker({ position, onChange, disabled }) {
  const tiles = useMapTiles('You can still enter coordinates below.');
  return <>
    <p className="text-sm mb-3">Click the map to place a pin or drag the selected pin. You can also enter precise coordinates below. No address is converted automatically.</p>
    {tiles.feedback}
    <MapContainer center={position || DEFAULT_MAP_CENTER} zoom={position ? 13 : DEFAULT_MAP_ZOOM} minZoom={2} maxZoom={19}
      className="marketplace-map business-location-picker" keyboard={false} zoomControl={false} scrollWheelZoom={false} inertia={false} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false}>
      {tiles.layer}<MapKeyboard label="Business location picker" /><ZoomControl position="bottomleft" />
      <Placement position={position} onChange={onChange} disabled={disabled} />
    </MapContainer>
  </>;
}
