import { test as base, expect } from '@playwright/test';
import type { TestUser } from '../fixtures/test-users';
import { CartPage } from './pages/cart-page';
import { CheckoutPage } from './pages/checkout-page';
import { LoginPage } from './pages/login-page';
import { OrderDetailPage } from './pages/order-detail-page';
import { ShopPage } from './pages/shop-page';
import { SiteHeader } from './pages/site-header';

interface AppFixtures {
  /** Auto fixture: every test starts from the deterministic seed. */
  resetDb: void;
  login: LoginPage;
  shop: ShopPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderDetail: OrderDetailPage;
  header: SiteHeader;
  signInAs: (user: TestUser) => Promise<void>;
}

export const test = base.extend<AppFixtures>({
  resetDb: [
    async ({ request }, use) => {
      const response = await request.post('/api/test/reset');
      expect(response.status(), 'test reset endpoint must be reachable').toBe(200);
      await use();
    },
    { auto: true },
  ],

  // Depends on resetDb so the database is seeded before any sign-in attempt.
  login: async ({ page, resetDb: _resetDb }, use) => {
    await use(new LoginPage(page));
  },

  shop: async ({ page }, use) => {
    await use(new ShopPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  orderDetail: async ({ page }, use) => {
    await use(new OrderDetailPage(page));
  },

  header: async ({ page }, use) => {
    await use(new SiteHeader(page));
  },

  signInAs: async ({ page, login }, use) => {
    await use(async (user: TestUser) => {
      await login.open();
      await login.signIn(user.email, user.password);
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    });
  },
});

export { expect };
