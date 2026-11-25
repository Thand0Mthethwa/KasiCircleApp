import { describe, expect, it } from 'vitest';
import { bookingTime, requestKey, sastInput, sastInstant, servicePrice } from './commerce';

describe('booking display', () => {
  it('interprets form times in South Africa even when the browser uses another timezone', () => {
    const instant = sastInstant('2030-01-02T00:30');
    expect(instant).toBe('2030-01-01T22:30:00.000Z');
    expect(sastInput(instant)).toBe('2030-01-02T00:30');
    expect(bookingTime(instant)).toContain('SAST');
  });

  it('distinguishes fixed, starting and quote pricing', () => {
    expect(servicePrice({ priceModel: 'FIXED', price: 80.5 })).toMatch(/^R.*80/);
    expect(servicePrice({ priceModel: 'STARTING', price: 80.5 })).toMatch(/^From R/);
    expect(servicePrice({ priceModel: 'QUOTE' })).toBe('Quotation required');
  });

  it('creates a unique request key in UUID format', () => {
    const first = requestKey();
    expect(first).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(requestKey()).not.toBe(first);
  });
});
