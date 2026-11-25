export const paymentLabels = {
  PENDING: 'Awaiting provider confirmation',
  PROCESSING: 'Payment pending',
  PAID: 'Test payment verified',
  FAILED: 'Test payment failed',
  ABANDONED: 'Test checkout abandoned',
  REFUND_REQUIRED: 'Payment requires refund review',
};

export const validPaymentReference = (reference) => /^KC-[a-f0-9-]{36}$/.test(reference || '');

export function authDestination(state) {
  if (validPaymentReference(state?.paymentReference)) return `/payments/return?reference=${state.paymentReference}`;
  return state?.returnToCart === true ? '/cart' : '/home';
}

export function hostedCheckout(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === 'https://checkout.paystack.com' && !parsed.username && !parsed.password
      && /^\/[A-Za-z0-9_-]+$/.test(parsed.pathname) && !parsed.search && !parsed.hash ? parsed.href : null;
  } catch {
    return null;
  }
}
