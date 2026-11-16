import PlaceAttribution from './PlaceAttribution';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../models/mapLocation';
import { Button } from './index';
import { markerIcon, MapKeyboard, useMapTiles } from './mapRuntime';

function Placement({ position, area, onChange, disabled }) {
  const map = useMap();
  useMapEvents({ click: event => { if (!disabled) onChange(event.latlng.wrap().lat, event.latlng.wrap().lng); } });
  useEffect(() => { if (area) map.setView([area.latitude, area.longitude], 14, { animate: false }); }, [map, area]);
  useEffect(() => { if (position) map.setView(position, Math.max(map.getZoom(), 13), { animate: false }); }, [map, position]);
  return position ? <Marker position={position} icon={markerIcon} draggable={!disabled} keyboard alt="Selected business location" title="Drag to move the business location"
    eventHandlers={{ dragend: event => { if (!disabled) { const point = event.target.getLatLng().wrap();onChange(point.lat, point.lng); } } }} /> : null;
}

export default function BusinessLocationPicker({ position, area, onChange, disabled }) {
  const [map, setMap] = useState(null);
  const tiles = useMapTiles('You can still use the Advanced section below.');
  return <>
    <p className="text-sm mb-3">Move the map to your business, then tap to place the pin. Drag the pin to move it. Use the zoom buttons or keyboard + and − to zoom.</p>
    {tiles.feedback}
    <MapContainer ref={setMap} center={position || (area ? [area.latitude, area.longitude] : DEFAULT_MAP_CENTER)} zoom={position ? 13 : area ? 14 : DEFAULT_MAP_ZOOM} minZoom={2} maxZoom={19}
      className="marketplace-map business-location-picker" keyboard={false} zoomControl={false} scrollWheelZoom={false} inertia={false} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false}>
      {tiles.layer}<MapKeyboard label="Business location picker" /><ZoomControl position="bottomleft" />
      <Placement position={position} area={area} onChange={onChange} disabled={disabled} />
    </MapContainer>
    <PlaceAttribution />
    {!disabled && <><p className="text-sm">You can also use the arrow keys to move the map, then choose the button below.</p>
      <Button type="button" variant="secondary" disabled={!map} onClick={() => { const point = map.getCenter().wrap();onChange(point.lat, point.lng); }}>Place pin in the middle of the map</Button></>}
  </>;
}
