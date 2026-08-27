import { test, expect } from '../../fixtures/test';
import { uniqueReviewIdentity } from './review-form-page-helpers';

test.describe('Review submission', () => {
  test('submits a review and follows its status until a terminal state, then opens its detail', async ({
    page,
    reviewFormPage,
    reviewPage,
    reviewDetailModal,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Empresa E2E');
    const comment = 'Chegou frio e atrasado, muito ruim.';

    await page.goto('/');
    await page.getByRole('link', { name: 'Enviar Avaliação' }).click();
    await expect(page).toHaveURL(/\/avaliar$/);

    await reviewFormPage.submit({ externalId, companyId, comment });
    await expect(reviewFormPage.successToast).toBeVisible();

    await page.getByRole('link', { name: 'Monitoramento' }).click();
    await expect(page).toHaveURL(/\/admin\/avaliacoes$/);

    const row = reviewPage.row(companyId);
    await expect(row).toBeVisible();
    await expect(row.getByText('Pendente').or(row.getByText('Processando'))).toBeVisible();

    await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });

    await row.click();
    await reviewDetailModal.expectVisible();
    await reviewDetailModal.expectComment(comment);
  });
});
