import { expect, type Locator, type Page } from '@playwright/test';

/** The review detail modal (SelectedReviewModal) — shared by row clicks,
 * the "Ver detalhes" eye button, and the notification bell, so it's its
 * own component object rather than living inside one page object. */
export class ReviewDetailModal {
  readonly page: Page;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Detalhe da avaliação' });
  }

  async expectVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectComment(comment: string): Promise<void> {
    await expect(this.dialog.getByText(comment)).toBeVisible();
  }

  async expectCompany(companyId: string): Promise<void> {
    await expect(this.dialog.getByText(companyId, { exact: true })).toBeVisible();
  }

  retryButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Reprocessar avaliação' });
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.dialog).not.toBeVisible();
  }
}
