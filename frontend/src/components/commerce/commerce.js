const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const date = new Intl.DateTimeFormat('en-ZA', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg',
});

export const servicePrice = (service) => {
  if (service.priceModel === 'QUOTE') return 'Quotation required';
  return `${service.priceModel === 'STARTING' ? 'From ' : ''}${money.format(service.price)}`;
};

export const bookingTime = (value) => `${date.format(new Date(value))} SAST`;
export const rand = (value) => money.format(value);
export const sastInstant = (value) => new Date(`${value}+02:00`).toISOString();
export const sastInput = (value) => new Date(new Date(value).getTime() + 7200000).toISOString().slice(0, 16);

export const statusLabels = {
  REQUESTED: 'Awaiting provider response',
  PROPOSED: 'Alternative proposed',
  ACCEPTED: 'Booking confirmed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  IN_PROGRESS: 'Work in progress',
  COMPLETED: 'Work completed',
  EXPIRED: 'Request expired',
};

export const isProvider = (user) => ['BUSINESS', 'WORKER'].includes(user?.accountType);

export function requestKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
