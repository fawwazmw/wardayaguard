import { expect, type Locator, type Page } from '@playwright/test';

export class SiteHeader {
  constructor(readonly page: Page) {}

  async expectSignedInAs(name: string): Promise<void> {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible();
  }

  async expectSignedOut(): Promise<void> {
    await expect(this.page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  }

  async openCart(): Promise<void> {
    await this.page.getByRole('link', { name: /^Cart/ }).click();
  }

  async openOrders(): Promise<void> {
    await this.page.getByRole('link', { name: 'Orders', exact: true }).click();
  }

  async signOut(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign out' }).click();
    await this.expectSignedOut();
  }

  async expectCartCount(count: number): Promise<void> {
    await expect(this.page.getByTestId('cart-count')).toHaveText(String(count));
  }

  cartCount(): Locator {
    return this.page.getByTestId('cart-count');
  }
}
