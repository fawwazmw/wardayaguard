/**
 * Pricing rules for Wardaya Store.
 *
 * The rules are defined in docs/business-rules.md. Tests validate the
 * specification, not an assumption about how the storefront happens to behave.
 *
 * - All amounts are integer cents, currency USD.
 * - Discounts apply to the item subtotal only, never to shipping.
 * - Discounts are rounded half up to the nearest cent.
 * - Shipping is free when the discounted subtotal is at or above the threshold.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
export const FLAT_SHIPPING_FEE_CENTS = 599;

export interface PricingLine {
  unitPriceCents: number;
  quantity: number;
}

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

function assertLine(line: PricingLine): void {
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new RangeError('unitPriceCents must be a non-negative integer');
  }
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError('quantity must be a positive integer');
  }
}

export function subtotalOf(lines: readonly PricingLine[]): number {
  return lines.reduce((total, line) => {
    assertLine(line);
    return total + line.unitPriceCents * line.quantity;
  }, 0);
}

export function discountFor(subtotalCents: number, percentOff: number): number {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new RangeError('subtotalCents must be a non-negative integer');
  }
  if (!Number.isInteger(percentOff) || percentOff < 0 || percentOff > 100) {
    throw new RangeError('percentOff must be an integer between 0 and 100');
  }
  return Math.round((subtotalCents * percentOff) / 100);
}

export function shippingFor(amountAfterDiscountCents: number): number {
  if (!Number.isInteger(amountAfterDiscountCents) || amountAfterDiscountCents < 0) {
    throw new RangeError('amountAfterDiscountCents must be a non-negative integer');
  }
  return amountAfterDiscountCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
}

export function totalsFor(lines: readonly PricingLine[], percentOff = 0): OrderTotals {
  const subtotalCents = subtotalOf(lines);
  const discountCents = discountFor(subtotalCents, percentOff);
  const afterDiscount = subtotalCents - discountCents;
  const shippingCents = shippingFor(afterDiscount);
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
  };
}
