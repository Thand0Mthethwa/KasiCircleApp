import { rand } from './commerce';

export const formatMinor = (minor) => rand(minor / 100);
export const subtotal = (items) => items.reduce((total, item) => total + item.priceMinor * item.quantity, 0);

export function decimalPrice(minor) {
  const digits = String(minor).padStart(3, '0');
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function minorPrice(value) {
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split(/[.,]/);
  const price = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return price > 0 && price <= 100000000 ? price : null;
}

export const orderLabels = {
  PLACED: 'Awaiting business response',
  ACCEPTED: 'Order accepted',
  PREPARING: 'Preparing',
  READY_FOR_COLLECTION: 'Ready for collection',
  COMPLETED: 'Collected',
  REJECTED: 'Order rejected',
  CANCELLED: 'Order cancelled',
};

export const orderActions = {
  ACCEPTED: 'Accept order',
  PREPARING: 'Start preparing',
  READY_FOR_COLLECTION: 'Mark ready for collection',
  COMPLETED: 'Mark collected',
  REJECTED: 'Reject order',
  CANCELLED: 'Cancel order',
};
