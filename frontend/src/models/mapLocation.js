// Only public business coordinates are eligible. Never coerce strings, nulls or worker data.
export function hasPublicBusinessCoordinates(business) {
  return business?.type === 'business' && validCoordinates(business.latitude, business.longitude);
}

export const DEFAULT_MAP_CENTER = [-28.5, 24.5]; // General South African extent, not a provider location.
export const DEFAULT_MAP_ZOOM = 5;

export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}
