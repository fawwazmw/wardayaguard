import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/fixtures';
import type { CartBody, ErrorBody } from '../support/types';

test.describe('cart', () => {
  test('CART-001 adding a product creates a line with the correct price and quantity', async ({
    standard,
  }) => {
    const response = await standard.post<CartBody>('/api/cart/items', {
      productId: 2,
      quantity: 2,
    });

    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      productId: 2,
      unitPriceCents: 2_900,
      quantity: 2,
      lineTotalCents: 5_800,
    });
    expect(response.body.subtotalCents).toBe(5_800);
  });

  test('adding the same product twice merges the quantity instead of duplicating the line', async ({
    standard,
  }) => {
    await standard.post('/api/cart/items', { productId: 2, quantity: 2 });
    const response = await standard.post<CartBody>('/api/cart/items', {
      productId: 2,
      quantity: 3,
    });

    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]?.quantity).toBe(5);
    expect(response.body.subtotalCents).toBe(14_500);
  });

  test('CART-002 changing the quantity recalculates the subtotal', async ({ standard }) => {
    const added = await standard.post<CartBody>('/api/cart/items', {
      productId: 2,
      quantity: 2,
    });
    const itemId = added.body.items[0]?.id;

    const updated = await standard.patch<CartBody>(`/api/cart/items/${itemId}`, { quantity: 4 });

    expect(updated.status).toBe(200);
    expect(updated.body.items[0]?.quantity).toBe(4);
    expect(updated.body.subtotalCents).toBe(11_600);
  });

  test('CART-003 removing the last item empties the cart', async ({ standard }) => {
    const added = await standard.post<CartBody>('/api/cart/items', {
      productId: 5,
      quantity: 1,
    });
    const itemId = added.body.items[0]?.id;

    const removed = await standard.delete(`/api/cart/items/${itemId}`);
    const cart = await standard.get<CartBody>('/api/cart');

    expect(removed.status).toBe(204);
    expect(cart.body).toEqual({ items: [], subtotalCents: 0 });
  });

  test('CART-004 rejects quantities that are not positive integers', async ({ standard }) => {
    const invalidQuantities = [0, -1, 1.5, '3'];

    for (const quantity of invalidQuantities) {
      const response = await standard.post<ErrorBody>('/api/cart/items', {
        productId: 2,
        quantity,
      });

      expect(response.status, `quantity ${JSON.stringify(quantity)} should be rejected`).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('CART-005 rejects a quantity above available stock', async ({ standard }) => {
    const response = await standard.post<ErrorBody>('/api/cart/items', {
      productId: 3,
      quantity: 5,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
    expect(response.body.error.details).toMatchObject({ available: 4, requested: 5 });
  });

  test('PROD-004 an unavailable product cannot be added to the cart', async ({ standard }) => {
    const response = await standard.post<ErrorBody>('/api/cart/items', {
      productId: 8,
      quantity: 1,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PRODUCT_UNAVAILABLE');
  });

  test('an unknown product cannot be added to the cart', async ({ standard }) => {
    const response = await standard.post<ErrorBody>('/api/cart/items', {
      productId: 999_999,
      quantity: 1,
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  test('API-001 the cart requires authentication', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/cart');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test("a customer cannot modify another customer's cart line", async ({ standard, rival }) => {
    const added = await standard.post<CartBody>('/api/cart/items', {
      productId: 2,
      quantity: 1,
    });
    const itemId = added.body.items[0]?.id;

    const response = await rival.patch<ErrorBody>(`/api/cart/items/${itemId}`, { quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('CART_ITEM_NOT_FOUND');
  });

  test('a customer only sees their own cart', async ({ standard, rival }) => {
    await standard.post('/api/cart/items', { productId: 2, quantity: 1 });

    const rivalCart = await rival.get<CartBody>('/api/cart');

    expect(rivalCart.status).toBe(200);
    expect(rivalCart.body).toEqual({ items: [], subtotalCents: 0 });
  });

  test('a second login on the same account sees the same cart', async ({
    standard,
    api,
    request,
  }) => {
    await standard.post('/api/cart/items', { productId: 2, quantity: 1 });

    const secondSession = await api.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    const secondCart = await request.get('/api/cart', {
      headers: { authorization: `Bearer ${secondSession.body.token}` },
    });

    expect(secondCart.status()).toBe(200);
    expect((await secondCart.json()) as CartBody).toMatchObject({ subtotalCents: 2_900 });
  });
});
