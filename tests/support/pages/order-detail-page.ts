import { expect, type Locator, type Page } from '@playwright/test';

export class OrderDetailPage {
  constructor(readonly page: Page) {}

  async expectConfirmed(): Promise<void> {
    await expect(this.page.getByTestId('order-heading')).toHaveText('Order confirmed');
  }

  async expectTotal(total: string): Promise<void> {
    await expect(this.page.getByTestId('order-total')).toHaveText(total);
  }

  async expectShipping(text: string): Promise<void> {
    await expect(this.page.getByTestId('order-shipping')).toHaveText(text);
  }

  async openAllOrders(): Promise<void> {
    await this.page.getByRole('link', { name: 'View all orders' }).click();
    await expect(this.page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible();
  }

  rows(): Locator {
    return this.page.getByTestId('order-row');
  }
}
