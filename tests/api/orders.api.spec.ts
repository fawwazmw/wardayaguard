import type { ApiClient } from '../support/api-client';
import { DISCOUNT_CODES, SHIPPING, newIdempotencyKey } from '../fixtures/test-data';
import { TEST_PRODUCTS } from '../fixtures/test-products';
import { expect, test } from '../support/fixtures';
import type { CartBody, ErrorBody, OrderBody, OrderListBody, ProductBody } from '../support/types';

async function addToCart(client: ApiClient, productId: number, quantity: number): Promise<void> {
  const response = await client.post<CartBody>('/api/cart/items', { productId, quantity });
  expect(response.status, 'cart setup should succeed').toBe(201);
}

function checkout(
  client: ApiClient,
  body: Record<string, unknown> = SHIPPING,
  key: string = newIdempotencyKey(),
) {
  return client.post<OrderBody>('/api/orders/checkout', body, { 'idempotency-key': key });
}

test.describe('checkout and orders', () => {
  test('CHK-004 a successful checkout creates one order with the correct line items', async ({
    standard,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 2);

    const order = await checkout(standard);

    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      status: 'confirmed',
      subtotalCents: 2_400,
      discountCents: 0,
      shippingCents: 599,
      totalCents: 2_999,
      replayed: false,
    });
    expect(order.body.items).toEqual([
      {
        productId: TEST_PRODUCTS.socks.id,
        name: TEST_PRODUCTS.socks.name,
        unitPriceCents: TEST_PRODUCTS.socks.priceCents,
        quantity: 2,
        lineTotalCents: 2_400,
      },
    ]);

    const cart = await standard.get<CartBody>('/api/cart');
    expect(cart.body).toEqual({ items: [], subtotalCents: 0 });
  });

  test('CHK-003 shipping is free at or above the threshold', async ({ standard }) => {
    await addToCart(standard, TEST_PRODUCTS.hoodie.id, 1);

    const order = await checkout(standard);

    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      subtotalCents: 8_900,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 8_900,
    });
  });

  test('CHK-003 a discount reduces the subtotal before shipping is calculated', async ({
    standard,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 2);

    const order = await checkout(standard, {
      ...SHIPPING,
      discountCode: DISCOUNT_CODES.tenPercent,
    });

    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      subtotalCents: 2_400,
      discountCents: 240,
      shippingCents: 599,
      totalCents: 2_759,
      discountCode: DISCOUNT_CODES.tenPercent,
    });
  });

  test('CHK-003 an expired discount code is rejected and no order is created', async ({
    standard,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 1);

    const order = await checkout(standard, {
      ...SHIPPING,
      discountCode: DISCOUNT_CODES.expired,
    });
    const history = await standard.get<OrderListBody>('/api/orders');

    expect(order.status).toBe(400);
    expect((order.body as unknown as ErrorBody).error.code).toBe('INVALID_DISCOUNT_CODE');
    expect(history.body.count).toBe(0);
  });

  test('checkout decrements stock by the purchased quantity', async ({ standard, api }) => {
    const before = await api.get<ProductBody>(`/api/products/${TEST_PRODUCTS.socks.id}`);
    await addToCart(standard, TEST_PRODUCTS.socks.id, 3);

    await checkout(standard);

    const after = await api.get<ProductBody>(`/api/products/${TEST_PRODUCTS.socks.id}`);
    expect(before.body.stock).toBe(TEST_PRODUCTS.socks.stock);
    expect(after.body.stock).toBe(TEST_PRODUCTS.socks.stock - 3);
  });

  test('CHK-005 replaying the same idempotency key returns the original order', async ({
    standard,
    api,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 2);
    const key = newIdempotencyKey('replay');

    const first = await checkout(standard, SHIPPING, key);
    const second = await checkout(standard, SHIPPING, key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.replayed).toBe(true);

    const history = await standard.get<OrderListBody>('/api/orders');
    const product = await api.get<ProductBody>(`/api/products/${TEST_PRODUCTS.socks.id}`);

    expect(history.body.count).toBe(1);
    expect(product.body.stock).toBe(TEST_PRODUCTS.socks.stock - 2);
  });

  test('a checkout without an idempotency key is rejected', async ({ standard }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 1);

    const response = await standard.post<ErrorBody>('/api/orders/checkout', SHIPPING);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('CHK-002 missing shipping details prevent checkout', async ({ standard }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 1);
    const { postalCode: _postalCode, ...incomplete } = SHIPPING;

    const response = await standard.post<ErrorBody>('/api/orders/checkout', incomplete, {
      'idempotency-key': newIdempotencyKey(),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'postalCode' })]),
    );
  });

  test('an empty cart cannot be checked out', async ({ standard }) => {
    const response = await checkout(standard);

    expect(response.status).toBe(409);
    expect((response.body as unknown as ErrorBody).error.code).toBe('CART_EMPTY');
  });

  test('API-002 a customer cannot read another customer order by id', async ({
    standard,
    rival,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 1);
    const order = await checkout(standard);

    const foreign = await rival.get<ErrorBody>(`/api/orders/${order.body.id}`);
    const rivalHistory = await rival.get<OrderListBody>('/api/orders');

    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe('ORDER_NOT_FOUND');
    expect(rivalHistory.body.count).toBe(0);
  });

  test('order history only lists the authenticated customer orders', async ({
    standard,
    rival,
  }) => {
    await addToCart(standard, TEST_PRODUCTS.socks.id, 1);
    const standardOrder = await checkout(standard);

    await addToCart(rival, TEST_PRODUCTS.tee.id, 1);
    await checkout(rival);

    const standardHistory = await standard.get<OrderListBody>('/api/orders');
    const rivalHistory = await rival.get<OrderListBody>('/api/orders');

    expect(standardHistory.body.count).toBe(1);
    expect(rivalHistory.body.count).toBe(1);
    expect(standardHistory.body.items[0]?.id).toBe(standardOrder.body.id);
  });

  test('API-004 the last units of stock cannot be sold twice', async ({ standard, rival, api }) => {
    const productId = TEST_PRODUCTS.lowStock.id;
    expect(TEST_PRODUCTS.lowStock.stock).toBe(2);

    await addToCart(standard, productId, 2);
    await addToCart(rival, productId, 2);

    const [first, second] = await Promise.all([
      checkout(standard, SHIPPING, newIdempotencyKey('race-standard')),
      checkout(rival, SHIPPING, newIdempotencyKey('race-rival')),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const loser = first.status === 409 ? first : second;
    expect((loser.body as unknown as ErrorBody).error.code).toBe('OUT_OF_STOCK');

    const product = await api.get<ProductBody>(`/api/products/${productId}`);
    const standardHistory = await standard.get<OrderListBody>('/api/orders');
    const rivalHistory = await rival.get<OrderListBody>('/api/orders');

    expect(product.body.stock).toBe(0);
    expect(standardHistory.body.count + rivalHistory.body.count).toBe(1);
  });
});
