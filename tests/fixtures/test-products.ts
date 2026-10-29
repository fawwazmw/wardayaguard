export interface TestProduct {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  active: boolean;
}

/**
 * The catalogue contract. These are expectations, not a copy of the seed:
 * if the seed drifts, the catalogue test fails on purpose.
 */
export const TEST_PRODUCTS = {
  hoodie: {
    id: 1,
    slug: 'aurora-hoodie',
    name: 'Aurora Hoodie',
    priceCents: 8_900,
    stock: 12,
    active: true,
  },
  tee: {
    id: 2,
    slug: 'lumen-tee',
    name: 'Lumen Tee',
    priceCents: 2_900,
    stock: 30,
    active: true,
  },
  sneakers: {
    id: 3,
    slug: 'drift-sneakers',
    name: 'Drift Sneakers',
    priceCents: 12_900,
    stock: 4,
    active: true,
  },
  soldOut: {
    id: 4,
    slug: 'nightcap-beanie',
    name: 'Nightcap Beanie',
    priceCents: 1_900,
    stock: 0,
    active: true,
  },
  tote: {
    id: 5,
    slug: 'solstice-tote',
    name: 'Solstice Tote',
    priceCents: 3_500,
    stock: 20,
    active: true,
  },
  lowStock: {
    id: 6,
    slug: 'archive-jacket',
    name: 'Archive Jacket',
    priceCents: 15_900,
    stock: 2,
    active: true,
  },
  socks: {
    id: 7,
    slug: 'halo-socks',
    name: 'Halo Socks',
    priceCents: 1_200,
    stock: 100,
    active: true,
  },
  inactive: {
    id: 8,
    slug: 'ghost-shell',
    name: 'Ghost Shell',
    priceCents: 9_900,
    stock: 5,
    active: false,
  },
} as const satisfies Record<string, TestProduct>;

export const ALL_TEST_PRODUCTS = Object.values(TEST_PRODUCTS);
