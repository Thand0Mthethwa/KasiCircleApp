import { validCoordinates } from '../models/mapLocation';
export const LOW_ACCURACY_METRES = 100;
const messages = {
  1: 'Location permission was not given. You can still choose your business on the map.',
  2: 'Your device could not find your location. Try again or choose on the map.',
  3: 'Finding your location took too long. Try again or choose on the map.',
};
export function requestDeviceLocation({ secure = window.isSecureContext, geolocation = navigator.geolocation } = {}) {
  if (!secure) return Promise.reject(new Error('Current location needs a secure connection. You can still choose on the map.'));
  if (!geolocation?.getCurrentPosition) return Promise.reject(new Error('This browser cannot share your location. You can still choose on the map.'));
  return new Promise((resolve, reject) => {
    try { geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position?.coords || {};
      if (!validCoordinates(latitude, longitude)) { reject(new Error(messages[2]));return; }
      resolve({ latitude, longitude, accuracy,
        imprecise: !Number.isFinite(accuracy) || accuracy < 0 || accuracy > LOW_ACCURACY_METRES });
    }, error => reject(new Error(messages[error?.code] || messages[2])), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }); } catch { reject(new Error(messages[1])); }
  });
}
