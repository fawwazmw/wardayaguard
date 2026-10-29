import { Router } from 'express';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth';
import { db, type CartLineRow, type ProductRow } from '../db';
import { ApiError } from '../errors';

export const cartRouter = Router();
cartRouter.use(requireAuth);

const addItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export function cartSummary(userId: number) {
  const lines = db
    .prepare(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price_cents, p.stock, p.active
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.id`,
    )
    .all(userId) as CartLineRow[];

  const items = lines.map((line) => ({
    id: line.id,
    productId: line.product_id,
    name: line.name,
    unitPriceCents: line.price_cents,
    quantity: line.quantity,
    lineTotalCents: line.price_cents * line.quantity,
    stock: line.stock,
  }));

  return {
    items,
    subtotalCents: items.reduce((total, item) => total + item.lineTotalCents, 0),
  };
}

cartRouter.get('/', (request, response) => {
  response.json(cartSummary(currentUser(request).id));
});

cartRouter.post('/items', (request, response) => {
  const user = currentUser(request);
  const body = addItemSchema.parse(request.body);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(body.productId) as
    ProductRow | undefined;

  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', `No product with id ${body.productId}`);
  }
  if (product.active !== 1) {
    throw new ApiError(
      409,
      'PRODUCT_UNAVAILABLE',
      `${product.name} is not available for purchase`,
      {
        productId: product.id,
      },
    );
  }

  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(user.id, product.id) as { id: number; quantity: number } | undefined;

  const requested = (existing?.quantity ?? 0) + body.quantity;
  if (requested > product.stock) {
    throw new ApiError(
      409,
      'OUT_OF_STOCK',
      `Only ${product.stock} unit(s) of ${product.name} available`,
      { productId: product.id, available: product.stock, requested },
    );
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(requested, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      user.id,
      product.id,
      body.quantity,
    );
  }

  response.status(201).json(cartSummary(user.id));
});

cartRouter.patch('/items/:id', (request, response) => {
  const user = currentUser(request);
  const itemId = z.coerce.number().int().positive().parse(request.params.id);
  const body = updateItemSchema.parse(request.body);

  const line = db
    .prepare(
      `SELECT ci.id, ci.quantity, p.stock, p.active, p.name
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.id = ? AND ci.user_id = ?`,
    )
    .get(itemId, user.id) as
    { id: number; quantity: number; stock: number; active: number; name: string } | undefined;

  if (!line) {
    throw new ApiError(404, 'CART_ITEM_NOT_FOUND', `No cart item with id ${itemId}`);
  }
  if (line.active !== 1) {
    throw new ApiError(409, 'PRODUCT_UNAVAILABLE', `${line.name} is not available for purchase`);
  }
  if (body.quantity > line.stock) {
    throw new ApiError(
      409,
      'OUT_OF_STOCK',
      `Only ${line.stock} unit(s) of ${line.name} available`,
      {
        available: line.stock,
        requested: body.quantity,
      },
    );
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(body.quantity, line.id);
  response.json(cartSummary(user.id));
});

cartRouter.delete('/items/:id', (request, response) => {
  const user = currentUser(request);
  const itemId = z.coerce.number().int().positive().parse(request.params.id);

  const result = db
    .prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
    .run(itemId, user.id);

  if (result.changes === 0) {
    throw new ApiError(404, 'CART_ITEM_NOT_FOUND', `No cart item with id ${itemId}`);
  }

  response.status(204).end();
});
