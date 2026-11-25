import { describe, expect, it } from 'vitest';
import { decimalPrice, minorPrice, subtotal } from './shop';

describe('shop pricing in ZAR cents', () => {
  it('parses rand or cents with exact integer arithmetic', () => {
    expect(minorPrice('37,50')).toBe(3750);
    expect(minorPrice('0.1')).toBe(10);
    expect(minorPrice('1000000')).toBe(100000000);
    expect(decimalPrice(1)).toBe('0.01');
    expect(subtotal([{ quantity: 3, priceMinor: 37 }, { quantity: 2, priceMinor: 99 }])).toBe(309);
  });

  it('rejects malformed prices, excess precision and prices outside the catalog range', () => {
    for (const value of ['0', '-1', '0.001', '1e2', '1000000.01', '1.']) {
      expect(minorPrice(value)).toBeNull();
    }
  });
});
