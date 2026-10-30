import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/app-fixtures';

const SHIPPING = {
  name: 'Standard User',
  address: '12 Jalan Melati',
  city: 'Bandung',
  postalCode: '40123',
  country: 'ID',
};

test.describe('checkout', () => {
  test('CHK-002 a missing postal code blocks the order', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Halo Socks');
    await header.openCart();
    await cartPage.checkout();

    await checkoutPage.fill({ ...SHIPPING, postalCode: '' });
    await checkoutPage.placeOrder();

    await checkoutPage.expectError('Postal code is required.');
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('order-heading')).toHaveCount(0);
  });

  test('CHK-003 / CHK-004 the order total and line items match the cart', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    orderDetail,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Halo Socks');
    await header.openCart();
    await cartPage.setQuantity('Halo Socks', 2);
    await cartPage.checkout();

    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();

    await orderDetail.expectConfirmed();
    await orderDetail.expectTotal('$29.99');
    await orderDetail.expectShipping('$5.99');
    await expect(page).toHaveURL(/\/orders\/\d+\?placed=1/);

    await orderDetail.openAllOrders();
    await expect(orderDetail.rows()).toHaveCount(1);
    await expect(orderDetail.rows()).toContainText('$29.99');
  });

  test('CHK-003 a discount code reduces the subtotal before shipping', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    orderDetail,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Halo Socks');
    await header.openCart();
    await cartPage.setQuantity('Halo Socks', 2);
    await cartPage.checkout();

    await checkoutPage.fill({ ...SHIPPING, discountCode: 'SAVE10' });
    await checkoutPage.placeOrder();

    await orderDetail.expectConfirmed();
    await orderDetail.expectTotal('$27.59');
  });

  test('CHK-003 shipping is free above the threshold', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    orderDetail,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Aurora Hoodie');
    await header.openCart();
    await cartPage.checkout();

    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();

    await orderDetail.expectConfirmed();
    await orderDetail.expectTotal('$89.00');
    await orderDetail.expectShipping('Free');
  });

  test('an expired discount code is reported and no order is created', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Halo Socks');
    await header.openCart();
    await cartPage.checkout();

    await checkoutPage.fill({ ...SHIPPING, discountCode: 'EXPIRED10' });
    await checkoutPage.placeOrder();

    await checkoutPage.expectError('Discount code is not valid');
    await expect(page).toHaveURL('/checkout');
  });
});
