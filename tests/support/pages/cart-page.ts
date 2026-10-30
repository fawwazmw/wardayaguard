import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  constructor(readonly page: Page) {}

  line(name: string): Locator {
    return this.page.getByTestId('cart-line').filter({ hasText: name });
  }

  async expectLine(name: string, total: string): Promise<void> {
    await expect(this.line(name).getByTestId('line-total')).toHaveText(total);
  }

  async expectSubtotal(total: string): Promise<void> {
    await expect(this.page.getByTestId('cart-subtotal')).toHaveText(total);
  }

  async setQuantity(name: string, quantity: number): Promise<void> {
    await this.page.getByLabel(`Quantity for ${name}`, { exact: true }).fill(String(quantity));
    await this.page.getByRole('button', { name: `Update quantity for ${name}` }).click();
  }

  async remove(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove ${name}` }).click();
  }

  async checkout(): Promise<void> {
    await this.page.getByRole('link', { name: 'Continue to checkout' }).click();
    await expect(this.page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}
