import { expect, type Page } from '@playwright/test';

export interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  discountCode: string;
}

export class CheckoutPage {
  constructor(readonly page: Page) {}

  async expectReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  }

  async fill(details: Partial<ShippingDetails>): Promise<void> {
    const fields: Array<[keyof ShippingDetails, string]> = [
      ['name', 'Full name'],
      ['address', 'Address'],
      ['city', 'City'],
      ['postalCode', 'Postal code'],
      ['country', 'Country'],
      ['discountCode', 'Discount code (optional)'],
    ];

    for (const [key, label] of fields) {
      const value = details[key];
      if (value !== undefined) await this.page.getByLabel(label).fill(value);
    }
  }

  async placeOrder(): Promise<void> {
    await this.page.getByRole('button', { name: 'Place order' }).click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}
