import { describe, expect, it } from 'vitest';
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_FEE_CENTS,
  discountFor,
  shippingFor,
  subtotalOf,
  totalsFor,
} from '../../apps/api/src/pricing';

describe('pricing specification', () => {
  describe('subtotal', () => {
    it('multiplies unit price by quantity across lines', () => {
      expect(
        subtotalOf([
          { unitPriceCents: 2_900, quantity: 2 },
          { unitPriceCents: 1_200, quantity: 3 },
        ]),
      ).toBe(9_400);
    });

    it('rejects a zero or negative quantity', () => {
      expect(() => subtotalOf([{ unitPriceCents: 100, quantity: 0 }])).toThrow(RangeError);
      expect(() => subtotalOf([{ unitPriceCents: 100, quantity: -1 }])).toThrow(RangeError);
    });

    it('rejects a fractional quantity', () => {
      expect(() => subtotalOf([{ unitPriceCents: 100, quantity: 1.5 }])).toThrow(RangeError);
    });
  });

  describe('discount', () => {
    it('applies the percentage to the subtotal', () => {
      expect(discountFor(2_400, 10)).toBe(240);
    });

    it('rounds half up to the nearest cent', () => {
      expect(discountFor(1_235, 10)).toBe(124);
      expect(discountFor(1_234, 10)).toBe(123);
    });

    it('rejects a percentage outside 0..100', () => {
      expect(() => discountFor(1_000, -1)).toThrow(RangeError);
      expect(() => discountFor(1_000, 101)).toThrow(RangeError);
      expect(() => discountFor(1_000, 12.5)).toThrow(RangeError);
    });
  });

  describe('shipping', () => {
    it('charges the flat fee one cent below the threshold', () => {
      expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_FEE_CENTS);
    });

    it('is free exactly at the threshold', () => {
      expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    });

    it('is free above the threshold', () => {
      expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS + 1)).toBe(0);
    });
  });

  describe('order totals', () => {
    it('adds shipping after the discount, never discounts shipping', () => {
      // 2,400 subtotal, 10 percent off = 2,160, under the threshold so 599 shipping.
      expect(totalsFor([{ unitPriceCents: 1_200, quantity: 2 }], 10)).toEqual({
        subtotalCents: 2_400,
        discountCents: 240,
        shippingCents: FLAT_SHIPPING_FEE_CENTS,
        totalCents: 2_759,
      });
    });

    it('treats the discounted subtotal as the free-shipping input', () => {
      // 5,500 subtotal drops to 4,950 after 10 percent, which is below the threshold.
      expect(totalsFor([{ unitPriceCents: 5_500, quantity: 1 }], 10)).toEqual({
        subtotalCents: 5_500,
        discountCents: 550,
        shippingCents: FLAT_SHIPPING_FEE_CENTS,
        totalCents: 5_549,
      });
    });

    it('never produces a negative total at 100 percent off', () => {
      expect(totalsFor([{ unitPriceCents: 1_000, quantity: 1 }], 100)).toEqual({
        subtotalCents: 1_000,
        discountCents: 1_000,
        shippingCents: FLAT_SHIPPING_FEE_CENTS,
        totalCents: FLAT_SHIPPING_FEE_CENTS,
      });
    });

    it('charges shipping on an empty cart rather than crashing', () => {
      // The API rejects empty carts; this documents the pure-function behaviour.
      expect(totalsFor([], 0)).toEqual({
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: FLAT_SHIPPING_FEE_CENTS,
        totalCents: FLAT_SHIPPING_FEE_CENTS,
      });
    });
  });
});
