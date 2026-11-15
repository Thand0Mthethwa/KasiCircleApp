// Only public business coordinates are eligible. Never coerce strings, nulls or worker data.
export function hasPublicBusinessCoordinates(business) {
  return business?.type === 'business'
    && Number.isFinite(business.latitude) && business.latitude >= -90 && business.latitude <= 90
    && Number.isFinite(business.longitude) && business.longitude >= -180 && business.longitude <= 180;
}

export const DEFAULT_MAP_CENTER = [-28.5, 24.5]; // General South African extent, not a provider location.
export const DEFAULT_MAP_ZOOM = 5;
