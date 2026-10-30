import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/app-fixtures';

test.describe('catalogue', () => {
  test('PROD-001 the catalogue shows seeded names and prices', async ({ shop }) => {
    await shop.open();
    await shop.expectProductCount(8);

    const hoodie = shop.card('Aurora Hoodie');
    await expect(hoodie).toContainText('$89.00');
    await expect(hoodie).toContainText('In stock: 12');

    const soldOut = shop.card('Nightcap Beanie');
    await expect(soldOut).toContainText('Sold out');
  });

  test('PROD-002 search narrows the catalogue and handles no results', async ({ shop }) => {
    await shop.open();
    await shop.search('hood');
    await shop.expectProductCount(1);
    await expect(shop.card('Aurora Hoodie')).toBeVisible();

    await shop.search('zzz');
    await shop.expectProductCount(0);
    await expect(shop.page.getByRole('heading', { name: /No products match/ })).toBeVisible();

    await shop.clearSearch();
    await shop.expectProductCount(8);
  });

  test('PROD-003 price sorting works in both directions', async ({ shop }) => {
    await shop.open();

    await shop.sortBy('Price, low to high');
    await expect(shop.page.getByTestId('product-card').first()).toContainText('Halo Socks');

    await shop.sortBy('Price, high to low');
    await expect(shop.page.getByTestId('product-card').first()).toContainText('Archive Jacket');
  });

  test('PROD-004 sold out and inactive products cannot be purchased', async ({
    signInAs,
    shop,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();

    await expect(
      shop.card('Nightcap Beanie').getByRole('button', { name: 'Sold out' }),
    ).toBeDisabled();
    await expect(
      shop.card('Ghost Shell').getByRole('button', { name: 'Unavailable' }),
    ).toBeDisabled();
  });

  test('signed out visitors see a sign in path instead of a dead add button', async ({ shop }) => {
    await shop.open();

    await expect(
      shop.card('Aurora Hoodie').getByRole('link', { name: 'Sign in to buy' }),
    ).toBeVisible();
  });
});
