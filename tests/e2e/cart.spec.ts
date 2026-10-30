import { TEST_USERS } from '../fixtures/test-users';
import { test } from '../support/app-fixtures';

test.describe('cart', () => {
  test('CART-001 / CART-002 adding and updating changes the line and subtotal', async ({
    signInAs,
    shop,
    header,
    cartPage,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Aurora Hoodie');
    await header.expectCartCount(1);

    await header.openCart();
    await cartPage.expectLine('Aurora Hoodie', '$89.00');
    await cartPage.expectSubtotal('$89.00');

    await cartPage.setQuantity('Aurora Hoodie', 2);
    await cartPage.expectLine('Aurora Hoodie', '$178.00');
    await cartPage.expectSubtotal('$178.00');
  });

  test('CART-003 removing the only item empties the cart', async ({
    signInAs,
    shop,
    header,
    cartPage,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Aurora Hoodie');
    await header.openCart();

    await cartPage.remove('Aurora Hoodie');

    await cartPage.expectEmpty();
    await header.expectCartCount(0);
  });

  test('CART-005 a quantity above stock is rejected and the line is restored', async ({
    signInAs,
    shop,
    header,
    cartPage,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Archive Jacket');
    await header.openCart();

    await cartPage.setQuantity('Archive Jacket', 99);

    await cartPage.expectError('Only 2 unit(s) of Archive Jacket available');
    await cartPage.expectLine('Archive Jacket', '$159.00');
  });

  test('REG-002 the cart survives a page reload', async ({
    signInAs,
    shop,
    header,
    cartPage,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Lumen Tee');

    await page.reload();

    await header.expectCartCount(1);
    await header.openCart();
    await cartPage.expectLine('Lumen Tee', '$29.00');
  });
});
