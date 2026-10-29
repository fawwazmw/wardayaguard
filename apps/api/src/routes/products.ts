import { Router } from 'express';
import { z } from 'zod';
import { db, type ProductRow } from '../db';

export const productsRouter = Router();

const sortSchema = z.enum(['name_asc', 'price_asc', 'price_desc']);
type Sort = z.infer<typeof sortSchema>;

const orderBy: Record<Sort, string> = {
  name_asc: 'name ASC',
  price_asc: 'price_cents ASC, name ASC',
  price_desc: 'price_cents DESC, name ASC',
};

function toProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    stock: row.stock,
    active: row.active === 1,
    available: row.active === 1 && row.stock > 0,
  };
}

productsRouter.get('/', (request, response) => {
  const sort = sortSchema.parse(request.query.sort ?? 'name_asc');
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';

  const rows = search
    ? (db
        .prepare(`SELECT * FROM products WHERE name LIKE ? ORDER BY ${orderBy[sort]}`)
        .all(`%${search}%`) as ProductRow[])
    : (db.prepare(`SELECT * FROM products ORDER BY ${orderBy[sort]}`).all() as ProductRow[]);

  response.json({ items: rows.map(toProduct), count: rows.length });
});

productsRouter.get('/:id', (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;

  if (!row) {
    response.status(404).json({
      error: { code: 'PRODUCT_NOT_FOUND', message: `No product with id ${id}` },
    });
    return;
  }

  response.json(toProduct(row));
});
