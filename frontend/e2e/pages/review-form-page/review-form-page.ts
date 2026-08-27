import { expect, type Locator, type Page } from '@playwright/test';

export interface SubmitReviewInput {
  externalId: string;
  companyId: string;
  comment: string;
  rating?: 1 | 2 | 3 | 4 | 5;
}

/** The "Enviar Avaliação" page (/avaliar), where a review is created. */
export class ReviewFormPage {
  readonly page: Page;
  readonly externalIdInput: Locator;
  readonly companyInput: Locator;
  readonly commentInput: Locator;
  readonly submitButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.externalIdInput = page.getByLabel('ID do pedido');
    this.companyInput = page.getByLabel('Empresa');
    this.commentInput = page.getByLabel('Comentário');
    this.submitButton = page.getByRole('button', { name: 'Enviar avaliação' });
    this.successToast = page.getByText('Avaliação enviada para processamento');
  }

  async goto(): Promise<void> {
    await this.page.goto('/avaliar');
    await expect(this.page).toHaveURL(/\/avaliar$/);
  }

  // Mantine's Rating renders each star as a radio input positioned
  // off-screen (not just visually hidden), immediately followed by a
  // sibling <label for="..."> holding the visible star icon — clicking the
  // input directly leaves Playwright with no valid point to click, even
  // with force. The <label> is the real clickable target.
  ratingStar(value: 1 | 2 | 3 | 4 | 5): Locator {
    const input = this.page.getByRole('radio', { name: String(value), exact: true });
    return input.locator('xpath=following-sibling::label[1]');
  }

  async submit(input: SubmitReviewInput): Promise<void> {
    await this.externalIdInput.fill(input.externalId);
    await this.companyInput.fill(input.companyId);
    await this.commentInput.fill(input.comment);
    if (input.rating) {
      await this.ratingStar(input.rating).click();
    }
    await this.submitButton.click();
  }
}
