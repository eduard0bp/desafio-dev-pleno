import { expect, type Locator, type Page } from '@playwright/test';
import { escapeRegExp } from './notification-bell-helpers';

export class NotificationBell {
  readonly page: Page;
  readonly trigger: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trigger = page.getByRole('button', { name: 'Avaliações negativas' });
  }

  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.page.getByText('Avaliações negativas recentes')).toBeVisible();
  }

  item(companyId: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${escapeRegExp(companyId)}`) });
  }

  async expectItemVisible(companyId: string): Promise<void> {
    await expect(this.item(companyId)).toBeVisible();
  }

  async expectItemHidden(companyId: string): Promise<void> {
    await expect(this.item(companyId)).not.toBeVisible();
  }

  async selectItem(companyId: string): Promise<void> {
    await this.item(companyId).click();
  }
}
