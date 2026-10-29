import { ALL_TEST_PRODUCTS, TEST_PRODUCTS } from '../fixtures/test-products';
import { expect, test } from '../support/fixtures';
import type { ErrorBody, ProductBody } from '../support/types';

test.describe('product catalogue', () => {
  test.describe('PROD-001 catalogue contract', () => {
    for (const expected of ALL_TEST_PRODUCTS) {
      test(`${expected.name} matches the documented fixture`, async ({ api }) => {
        const response = await api.get<ProductBody>(`/api/products/${expected.id}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: expected.id,
          slug: expected.slug,
          name: expected.name,
          priceCents: expected.priceCents,
          stock: expected.stock,
          active: expected.active,
        });
        expect(response.body.available).toBe(expected.active && expected.stock > 0);
      });
    }
  });

  test('lists the full catalogue', async ({ api }) => {
    const response = await api.get<{ items: ProductBody[]; count: number }>('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(ALL_TEST_PRODUCTS.length);
    expect(response.body.items.map((item) => item.id).sort((a, b) => a - b)).toEqual(
      ALL_TEST_PRODUCTS.map((product) => product.id).sort((a, b) => a - b),
    );
  });

  test('PROD-003 sorts by price in both directions', async ({ api }) => {
    const ascending = await api.get<{ items: ProductBody[] }>('/api/products?sort=price_asc');
    const descending = await api.get<{ items: ProductBody[] }>('/api/products?sort=price_desc');

    const ascendingPrices = ascending.body.items.map((item) => item.priceCents);
    const descendingPrices = descending.body.items.map((item) => item.priceCents);

    expect(ascendingPrices).toEqual([...ascendingPrices].sort((a, b) => a - b));
    expect(descendingPrices).toEqual([...descendingPrices].sort((a, b) => b - a));
    expect(ascendingPrices[0]).toBe(TEST_PRODUCTS.socks.priceCents);
    expect(descendingPrices[0]).toBe(TEST_PRODUCTS.lowStock.priceCents);
  });

  test('PROD-002 search matches a partial name, case insensitively', async ({ api }) => {
    const response = await api.get<{ items: ProductBody[]; count: number }>(
      '/api/products?search=HOOD',
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.items[0]?.slug).toBe(TEST_PRODUCTS.hoodie.slug);
  });

  test('PROD-002 search with no match returns an empty list, not an error', async ({ api }) => {
    const response = await api.get<{ items: ProductBody[]; count: number }>(
      '/api/products?search=does-not-exist',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], count: 0 });
  });

  test('PROD-005 an unknown product id returns 404', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/products/999999');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  test('a non-numeric product id returns a validation error', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/products/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('an unknown sort key is rejected instead of silently defaulting', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/products?sort=cheapest');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
