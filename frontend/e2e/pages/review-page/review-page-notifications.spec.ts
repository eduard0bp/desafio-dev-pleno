import { test, expect } from '../../fixtures/test';
import { uniqueReviewIdentity } from '../review-form-page/review-form-page-helpers';

test.describe('Notification bell', () => {
  test('is only rendered on the listing page, not on the submission page', async ({ page, reviewPage }) => {
    await reviewPage.goto();
    await expect(reviewPage.bell.trigger).toBeVisible();

    await page.getByRole('link', { name: 'Enviar Avaliação' }).click();
    await expect(page).toHaveURL(/\/avaliar$/);
    await expect(reviewPage.bell.trigger).not.toBeVisible();
  });

  test('a new negative review appears unread in the bell, and selecting it opens its detail and marks it read', async ({
    page,
    reviewFormPage,
    reviewPage,
    reviewDetailModal,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Bell Test');

    await reviewFormPage.goto();
    // Same reasoning as the sentiment filter spec: strong negative keywords
    // plus a low rating make a negative outcome very likely, assuming the
    // review completes at all.
    await reviewFormPage.submit({
      externalId,
      companyId,
      comment: 'Comida horrivel, atendimento pessimo, nunca mais volto.',
      rating: 1,
    });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    const row = reviewPage.row(companyId);
    await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });
    test.skip(await row.getByText('Falhou').isVisible(), 'the mock analysis API simulated a failure; no sentiment was computed for this review');
    test.skip(!(await row.getByText('Negativo').isVisible()), 'the mock analysis API scored this review as non-negative');

    await reviewPage.goto();
    await reviewPage.bell.open();
    await reviewPage.bell.expectItemVisible(companyId);

    await reviewPage.bell.selectItem(companyId);
    await reviewDetailModal.expectVisible();
    await reviewDetailModal.expectCompany(companyId);
    await reviewDetailModal.close();

    await reviewPage.bell.open();
    await reviewPage.bell.expectItemHidden(companyId);
  });
});
