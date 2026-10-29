import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(sourceDir, '../../..');

function resolveDatabasePath(raw: string | undefined): string {
  const value = raw && raw.trim().length > 0 ? raw : '.data/wardaya.sqlite';
  return isAbsolute(value) ? value : join(repoRoot, value);
}

export const databasePath = resolveDatabasePath(process.env.DATABASE_PATH);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(join(sourceDir, 'schema.sql'), 'utf8'));

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
}

export interface ProductRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  stock: number;
  active: number;
}

export interface CartLineRow {
  id: number;
  product_id: number;
  name: string;
  price_cents: number;
  stock: number;
  active: number;
  quantity: number;
}

export interface OrderRow {
  id: number;
  user_id: number;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  discount_code: string | null;
  idempotency_key: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}
