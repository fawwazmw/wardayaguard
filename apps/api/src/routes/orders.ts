import { Router } from 'express';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth';
import { db, type CartLineRow, type OrderItemRow, type OrderRow } from '../db';
import { ApiError } from '../errors';
import { totalsFor } from '../pricing';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const checkoutSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(60),
  discountCode: z.string().trim().min(1).max(40).optional(),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

const idempotencyKeySchema = z.string().min(8).max(200);

function orderDto(order: OrderRow, items: OrderItemRow[]) {
  return {
    id: order.id,
    status: order.status,
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    discountCode: order.discount_code,
    createdAt: order.created_at,
    shipping: {
      name: order.shipping_name,
      address: order.shipping_address,
      city: order.shipping_city,
      postalCode: order.shipping_postal_code,
      country: order.shipping_country,
    },
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      unitPriceCents: item.unit_price_cents,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
    })),
  };
}

function findOrder(userId: number, orderId: number) {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(orderId, userId) as OrderRow | undefined;

  if (!order) return undefined;

  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
    .all(order.id) as OrderItemRow[];

  return orderDto(order, items);
}

/**
 * Runs inside a single SQLite transaction. Stock is decremented with a guarded
 * UPDATE, so a second request cannot take the last unit (API-004).
 */
const placeOrder = db.transaction((userId: number, body: CheckoutInput, idempotencyKey: string) => {
  const lines = db
    .prepare(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price_cents, p.stock, p.active
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.id`,
    )
    .all(userId) as CartLineRow[];

  if (lines.length === 0) {
    throw new ApiError(409, 'CART_EMPTY', 'Cannot check out with an empty cart');
  }

  for (const line of lines) {
    if (line.active !== 1) {
      throw new ApiError(
        409,
        'PRODUCT_UNAVAILABLE',
        `${line.name} is no longer available for purchase`,
        { productId: line.product_id },
      );
    }
    if (line.quantity > line.stock) {
      throw new ApiError(
        409,
        'OUT_OF_STOCK',
        `Only ${line.stock} unit(s) of ${line.name} available`,
        { productId: line.product_id, available: line.stock, requested: line.quantity },
      );
    }
  }

  let percentOff = 0;
  if (body.discountCode) {
    const code = db
      .prepare('SELECT code, percent_off, active FROM discount_codes WHERE code = ?')
      .get(body.discountCode.toUpperCase()) as
      { code: string; percent_off: number; active: number } | undefined;

    if (!code || code.active !== 1) {
      throw new ApiError(400, 'INVALID_DISCOUNT_CODE', 'Discount code is not valid');
    }
    percentOff = code.percent_off;
  }

  const totals = totalsFor(
    lines.map((line) => ({ unitPriceCents: line.price_cents, quantity: line.quantity })),
    percentOff,
  );

  const inserted = db
    .prepare(
      `INSERT INTO orders (
         user_id, status, subtotal_cents, discount_cents, shipping_cents, total_cents,
         discount_code, idempotency_key, shipping_name, shipping_address, shipping_city,
         shipping_postal_code, shipping_country
       ) VALUES (?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      totals.subtotalCents,
      totals.discountCents,
      totals.shippingCents,
      totals.totalCents,
      body.discountCode?.toUpperCase() ?? null,
      idempotencyKey,
      body.name,
      body.address,
      body.city,
      body.postalCode,
      body.country,
    );

  const orderId = Number(inserted.lastInsertRowid);
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const takeStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');

  for (const line of lines) {
    const taken = takeStock.run(line.quantity, line.product_id, line.quantity);
    if (taken.changes !== 1) {
      throw new ApiError(409, 'OUT_OF_STOCK', `${line.name} just went out of stock`, {
        productId: line.product_id,
      });
    }

    insertItem.run(
      orderId,
      line.product_id,
      line.name,
      line.price_cents,
      line.quantity,
      line.price_cents * line.quantity,
    );
  }

  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  return orderId;
});

ordersRouter.post('/checkout', (request, response) => {
  const user = currentUser(request);
  const idempotencyKey = idempotencyKeySchema.parse((request.get('idempotency-key') ?? '').trim());
  const body = checkoutSchema.parse(request.body);

  const replay = db
    .prepare('SELECT id FROM orders WHERE user_id = ? AND idempotency_key = ?')
    .get(user.id, idempotencyKey) as { id: number } | undefined;

  if (replay) {
    const existing = findOrder(user.id, replay.id);
    response.status(200).json({ ...existing, replayed: true });
    return;
  }

  const orderId = placeOrder(user.id, body, idempotencyKey);
  response.status(201).json({ ...findOrder(user.id, orderId), replayed: false });
});

ordersRouter.get('/', (request, response) => {
  const user = currentUser(request);
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(user.id) as OrderRow[];

  response.json({
    items: orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.total_cents,
      createdAt: order.created_at,
      itemCount: (
        db
          .prepare('SELECT COALESCE(SUM(quantity), 0) AS total FROM order_items WHERE order_id = ?')
          .get(order.id) as { total: number }
      ).total,
    })),
    count: orders.length,
  });
});

ordersRouter.get('/:id', (request, response) => {
  const user = currentUser(request);
  const orderId = z.coerce.number().int().positive().parse(request.params.id);
  const order = findOrder(user.id, orderId);

  // A foreign order is reported as missing, not forbidden: no existence leak (API-002).
  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'No order with that id');
  }

  response.json(order);
});
