import { test, expect } from '../../fixtures/test';
import { uniqueReviewIdentity } from '../review-form-page/review-form-page-helpers';

test.describe('Row actions', () => {
  test('clicking a row opens its detail modal, regardless of status', async ({
    page,
    reviewFormPage,
    reviewPage,
    reviewDetailModal,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Row Click Test');
    const comment = 'Comentário para o clique na linha.';

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    await reviewPage.search(companyId);
    await reviewPage.row(companyId).click();

    await reviewDetailModal.expectVisible();
    await reviewDetailModal.expectCompany(companyId);
    await reviewDetailModal.expectComment(comment);
  });

  test('a completed review shows an eye button that opens its detail; a failed one shows a retry button that resets it', async ({
    page,
    reviewFormPage,
    reviewPage,
    reviewDetailModal,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Action Button Test');
    const comment = 'Comentário para o botão de ação.';

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    const row = reviewPage.row(companyId);
    await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });
    await reviewPage.search(companyId);

    if (await row.getByText('Concluído').isVisible()) {
      await expect(reviewPage.retryButton(companyId)).not.toBeVisible();
      await reviewPage.viewDetailsButton(companyId).click();
      await reviewDetailModal.expectVisible();
      await reviewDetailModal.expectComment(comment);
    } else {
      await expect(reviewPage.viewDetailsButton(companyId)).not.toBeVisible();
      await reviewPage.retryButton(companyId).click();
      await expect(row.getByText('Falhou')).not.toBeVisible();
      await expect(row.getByText('Pendente').or(row.getByText('Processando'))).toBeVisible();
    }
  });
});
