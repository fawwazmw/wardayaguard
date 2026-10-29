import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { db } from './db';
import { hashPassword } from './auth';

export interface SeedUser {
  id: number;
  email: string;
  name: string;
  password: string;
}

/** Accounts created by the seed. Passwords are test-only and documented in the README. */
export const SEED_USERS: readonly SeedUser[] = [
  { id: 1, email: 'standard@wardaya.test', name: 'Standard User', password: 'Passw0rd!' },
  { id: 2, email: 'rival@wardaya.test', name: 'Rival User', password: 'Passw0rd!' },
];

interface SeedProduct {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  active: 0 | 1;
}

/**
 * Deterministic catalogue. Intentional fixtures: an out-of-stock item (id 4),
 * a low-stock item (id 6) and an inactive item (id 8) so negative paths are
 * reachable without ad-hoc setup.
 */
export const SEED_PRODUCTS: readonly SeedProduct[] = [
  {
    id: 1,
    slug: 'aurora-hoodie',
    name: 'Aurora Hoodie',
    description: 'Heavyweight cotton hoodie with a brushed inner lining.',
    priceCents: 8_900,
    stock: 12,
    active: 1,
  },
  {
    id: 2,
    slug: 'lumen-tee',
    name: 'Lumen Tee',
    description: 'Midweight organic cotton tee, boxy fit.',
    priceCents: 2_900,
    stock: 30,
    active: 1,
  },
  {
    id: 3,
    slug: 'drift-sneakers',
    name: 'Drift Sneakers',
    description: 'Low-profile sneakers with a gum sole.',
    priceCents: 12_900,
    stock: 4,
    active: 1,
  },
  {
    id: 4,
    slug: 'nightcap-beanie',
    name: 'Nightcap Beanie',
    description: 'Ribbed merino beanie. Currently sold out.',
    priceCents: 1_900,
    stock: 0,
    active: 1,
  },
  {
    id: 5,
    slug: 'solstice-tote',
    name: 'Solstice Tote',
    description: 'Waxed canvas tote with an interior pocket.',
    priceCents: 3_500,
    stock: 20,
    active: 1,
  },
  {
    id: 6,
    slug: 'archive-jacket',
    name: 'Archive Jacket',
    description: 'Boxy overshirt in washed twill. Limited run.',
    priceCents: 15_900,
    stock: 2,
    active: 1,
  },
  {
    id: 7,
    slug: 'halo-socks',
    name: 'Halo Socks',
    description: 'Three-pack of ribbed crew socks.',
    priceCents: 1_200,
    stock: 100,
    active: 1,
  },
  {
    id: 8,
    slug: 'ghost-shell',
    name: 'Ghost Shell',
    description: 'Packable shell jacket, archived for the season.',
    priceCents: 9_900,
    stock: 5,
    active: 0,
  },
];

interface SeedDiscount {
  code: string;
  percentOff: number;
  active: 0 | 1;
}

export const SEED_DISCOUNTS: readonly SeedDiscount[] = [
  { code: 'SAVE10', percentOff: 10, active: 1 },
  { code: 'SAVE25', percentOff: 25, active: 1 },
  { code: 'EXPIRED10', percentOff: 10, active: 0 },
];

function insertAll(): void {
  const insertUser = db.prepare(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
  );
  for (const user of SEED_USERS) {
    insertUser.run(user.id, user.email, user.name, hashPassword(user.password));
  }

  const insertProduct = db.prepare(
    `INSERT INTO products (id, slug, name, description, price_cents, stock, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const product of SEED_PRODUCTS) {
    insertProduct.run(
      product.id,
      product.slug,
      product.name,
      product.description,
      product.priceCents,
      product.stock,
      product.active,
    );
  }

  const insertDiscount = db.prepare(
    'INSERT INTO discount_codes (code, percent_off, active) VALUES (?, ?, ?)',
  );
  for (const discount of SEED_DISCOUNTS) {
    insertDiscount.run(discount.code, discount.percentOff, discount.active);
  }
}

/**
 * Wipes transactional data and restores the deterministic fixture set.
 * Used by the seed script and by the test-only reset endpoint. Never mount
 * that endpoint outside a test environment.
 */
export function resetDatabase(): void {
  const transaction = db.transaction(() => {
    db.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM cart_items;
      DELETE FROM sessions;
      DELETE FROM discount_codes;
      DELETE FROM products;
      DELETE FROM users;
    `);
    insertAll();
  });
  transaction();
}

export function seedIfEmpty(): void {
  const row = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
  if (row.count === 0) resetDatabase();
}

const isEntryPoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  resetDatabase();
  const products = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
  console.log(`[seed] database reset at ${process.env.DATABASE_PATH ?? '.data/wardaya.sqlite'}`);
  console.log(
    `[seed] ${products.count} products, ${SEED_USERS.length} users, ${SEED_DISCOUNTS.length} discount codes`,
  );
  db.close();
}
