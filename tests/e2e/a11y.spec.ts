import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/app-fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const SHIPPING = {
  name: 'Standard User',
  address: '12 Jalan Melati',
  city: 'Bandung',
  postalCode: '40123',
  country: 'ID',
};

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations;
}

function describeViolations(violations: Awaited<ReturnType<typeof scan>>): string {
  if (violations.length === 0) return 'none';
  return violations
    .map((violation) => `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}`)
    .join('\n');
}

async function expectClean(page: Page, label: string): Promise<void> {
  const violations = await scan(page);
  expect(violations, `${label}:\n${describeViolations(violations)}`).toEqual([]);
}

test.describe('accessibility', () => {
  test('A11Y-001 catalogue, empty search and login have no WCAG A or AA violations', async ({
    shop,
    page,
  }) => {
    await shop.open();
    await expectClean(page, 'Catalogue');

    await shop.search('zzz');
    await expect(page.getByRole('heading', { name: /No products match/ })).toBeVisible();
    await expectClean(page, 'Empty search state');

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expectClean(page, 'Login');
  });

  test('A11Y-002 the cart has no WCAG A or AA violations', async ({
    signInAs,
    shop,
    header,
    page,
  }) => {
    await signInAs(TEST_USERS.standard);
    await shop.open();
    await shop.addToCart('Aurora Hoodie');
    await header.openCart();
    await expect(page.getByRole('heading', { name: 'Cart', exact: true })).toBeVisible();

    await expectClean(page, 'Cart');
  });

  test('A11Y-003 checkout, confirmation and order history have no WCAG A or AA violations', async ({
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
    await header.openCart();
    await cartPage.checkout();
    await checkoutPage.expectReady();
    await expectClean(page, 'Checkout');

    await checkoutPage.fill(SHIPPING);
    await checkoutPage.placeOrder();
    await orderDetail.expectConfirmed();
    await expectClean(page, 'Order confirmation');

    await orderDetail.openAllOrders();
    await expectClean(page, 'Order history');
  });
});
