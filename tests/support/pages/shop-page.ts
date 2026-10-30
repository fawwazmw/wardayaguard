import { expect, type Locator, type Page } from '@playwright/test';

export class ShopPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Shop' })).toBeVisible();
  }

  card(name: string): Locator {
    return this.page.getByTestId('product-card').filter({ hasText: name });
  }

  async addToCart(name: string): Promise<void> {
    await this.card(name).getByRole('button', { name: 'Add to cart' }).click();
    await expect(this.page.getByTestId('catalogue-notice')).toContainText(`Added ${name} to cart.`);
  }

  async search(term: string): Promise<void> {
    await this.page.getByLabel('Search products').fill(term);
  }

  async clearSearch(): Promise<void> {
    await this.page.getByRole('button', { name: 'Clear search' }).click();
  }

  async sortBy(label: string): Promise<void> {
    await this.page.getByLabel('Sort by').selectOption({ label });
  }

  async expectProductCount(count: number): Promise<void> {
    await expect(this.page.getByTestId('product-card')).toHaveCount(count);
  }
}
