import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/app-fixtures';
import type { Page } from '@playwright/test';

const SHIPPING = {
  name: 'Standard User',
  address: '12 Jalan Melati',
  city: 'Bandung',
  postalCode: '40123',
  country: 'ID',
};

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the page should not scroll horizontally').toBeLessThanOrEqual(0);
}

test.describe('regression journeys', () => {
  test('REG-001 login to order confirmation to order history', async ({
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
    await shop.addToCart('Aurora Hoodie');
    await header.expectCartCount(1);

    await header.openCart();
    await cartPage.expectLine('Aurora Hoodie', '$89.00');
    await cartPage.checkout();

    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();

    await orderDetail.expectConfirmed();
    await orderDetail.expectTotal('$89.00');
    await expect(page.getByText('12 Jalan Melati, Bandung 40123, ID')).toBeVisible();

    await page.getByRole('link', { name: 'Orders', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible();
    await expect(page.getByTestId('order-row')).toHaveCount(1);
    await expect(page.getByTestId('order-row')).toContainText('$89.00');
  });

  test('REG-005 checkout controls are keyboard reachable with a visible focus ring', async ({
    signInAs,
    shop,
    header,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Lumen Tee');
    await header.openCart();
    await cartPage.checkout();
    await checkoutPage.expectReady();

    const fullName = page.getByLabel('Full name');
    await fullName.focus();
    await expect(fullName).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Address')).toBeFocused();

    const outlineStyle = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? getComputedStyle(element).outlineStyle : 'none';
    });
    expect(outlineStyle).not.toBe('none');
  });

  test('REG-006 another customer cannot open the order by id', async ({
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
    await shop.addToCart('Lumen Tee');
    await header.openCart();
    await cartPage.checkout();
    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();
    await orderDetail.expectConfirmed();

    const orderId = new URL(page.url()).pathname.split('/').pop();
    expect(orderId).toMatch(/^\d+$/);

    await header.signOut();
    await signInAs(TEST_USERS.rival);

    await page.goto(`/orders/${orderId}`);
    await expect(page.getByRole('alert')).toContainText('This order could not be loaded.');
  });
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('REG-004 the core journey works at a phone width', async ({
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
    await expectNoHorizontalOverflow(page);

    await shop.addToCart('Lumen Tee');
    await header.openCart();
    await expectNoHorizontalOverflow(page);

    await cartPage.checkout();
    await expectNoHorizontalOverflow(page);

    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();

    await orderDetail.expectConfirmed();
    await expectNoHorizontalOverflow(page);
  });
});
