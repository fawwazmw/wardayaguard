import { randomUUID } from 'node:crypto';

export const SHIPPING = {
  name: 'Standard User',
  address: '12 Jalan Melati',
  city: 'Bandung',
  postalCode: '40123',
  country: 'ID',
};

export const DISCOUNT_CODES = {
  tenPercent: 'SAVE10',
  twentyFivePercent: 'SAVE25',
  expired: 'EXPIRED10',
};

export function newIdempotencyKey(label = 'checkout'): string {
  return `${label}-${randomUUID()}`;
}
