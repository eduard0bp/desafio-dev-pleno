import { test, expect } from '../../fixtures/test';
import { uniqueReviewIdentity } from '../review-form-page/review-form-page-helpers';

test.describe('Field filters (desktop)', () => {
  test('search narrows the list to a company created through the form', async ({
    page,
    reviewFormPage,
    reviewPage,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Search Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Bom atendimento.' });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    await expect(reviewPage.row(companyId)).toBeVisible();

    await reviewPage.search(`${companyId} nao existe`);
    await expect(reviewPage.row(companyId)).not.toBeVisible();

    await reviewPage.search(companyId);
    await expect(reviewPage.row(companyId)).toBeVisible();
  });

  test('minimum rating filter keeps only reviews at or above it', async ({ page, reviewFormPage, reviewPage }) => {
    const high = uniqueReviewIdentity('Rating Test A');
    const low = uniqueReviewIdentity('Rating Test B');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ ...high, comment: 'Excelente!', rating: 5 });
    await reviewFormPage.goto();
    await reviewFormPage.submit({ ...low, comment: 'Regular.', rating: 2 });

    await page.getByRole('link', { name: 'Monitoramento' }).click();
    await reviewPage.search('Rating Test');
    await expect(reviewPage.row(high.companyId)).toBeVisible();
    await expect(reviewPage.row(low.companyId)).toBeVisible();

    await reviewPage.selectMinRating('4+ estrelas');
    await expect(reviewPage.row(high.companyId)).toBeVisible();
    await expect(reviewPage.row(low.companyId)).not.toBeVisible();
  });

  test('status chips keep only reviews with that status', async ({ page, reviewFormPage, reviewPage }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Status Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Testando o filtro de status.' });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    const row = reviewPage.row(companyId);
    await expect(row).toBeVisible();
    // The pipeline's outcome (which terminal status this lands on) is not
    // under this test's control — see review-form-page-submission.spec.ts —
    // so the assertions below adapt to whichever one actually happens
    // instead of assuming one.
    await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });
    const isCompleted = await row.getByText('Concluído').isVisible();
    const matchingChip = isCompleted ? 'Concluídos' : 'Falhas';
    const otherChip = isCompleted ? 'Falhas' : 'Concluídos';

    await reviewPage.search(companyId);
    await reviewPage.selectStatusChip(matchingChip);
    await expect(row).toBeVisible();

    await reviewPage.selectStatusChip(otherChip);
    await expect(row).not.toBeVisible();
  });

  test('sentiment filter keeps only completed reviews with that sentiment', async ({
    page,
    reviewFormPage,
    reviewPage,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Sentiment Test');

    await reviewFormPage.goto();
    // Strong keywords in both directions plus a low rating push the mock
    // analyzer's score well past its negative threshold (see
    // mock-analysis-api/src/analyzer.ts) — assuming the review completes at
    // all, its sentiment should reliably be negative.
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

    await expect(row.getByText('Negativo')).toBeVisible();

    await reviewPage.search(companyId);
    await reviewPage.selectSentiment('Negativo');
    await expect(row).toBeVisible();

    await reviewPage.selectSentiment('Positivo');
    await expect(row).not.toBeVisible();
  });

  test('date filter excludes reviews outside the selected range', async ({ page, reviewFormPage, reviewPage }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Date Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Testando o filtro de data.' });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    await reviewPage.search(companyId);
    await expect(reviewPage.row(companyId)).toBeVisible();

    // No review can have been created in the future, so this is a
    // deterministic way to prove the filter actually excludes something —
    // without needing a fixture dated in the past (see the comment on
    // review-page-helpers.ts for why the picker stays within the current
    // month either way).
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await reviewPage.pickDateFrom(tomorrow);
    await expect(reviewPage.row(companyId)).not.toBeVisible();
  });

  test('"Limpar filtros" clears every field filter at once', async ({ page, reviewFormPage, reviewPage }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Clear Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Ok.' });
    await page.getByRole('link', { name: 'Monitoramento' }).click();

    await reviewPage.search(companyId);
    await expect(reviewPage.row(companyId)).toBeVisible();
    await expect(reviewPage.desktopClearFiltersButton).toBeVisible();

    await reviewPage.clearFiltersDesktop();

    await expect(reviewPage.desktopClearFiltersButton).not.toBeVisible();
    await expect(reviewPage.searchInput).toHaveValue('');
  });
});

test.describe('Field filters (mobile drawer)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('editing the draft does not filter the list until "Aplicar filtros" is clicked', async ({
    reviewFormPage,
    reviewPage,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Mobile Draft Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Ok.' });
    // The sidebar nav is off-canvas on mobile (behind the burger menu), so
    // navigating there directly avoids depending on it for this test.
    await reviewPage.goto();
    await expect(reviewPage.row(companyId)).toBeVisible();

    await reviewPage.openMobileFilters();
    await reviewPage.searchInMobileDrawer(`${companyId} nao existe`);

    // Still on the drawer, over the unfiltered table underneath — the row
    // must still be present since the draft hasn't been applied yet.
    await expect(reviewPage.row(companyId)).toBeVisible();

    await reviewPage.applyMobileFilters();
    await expect(reviewPage.row(companyId)).not.toBeVisible();
  });

  test('"Limpar filtros" in the drawer clears the applied filters immediately', async ({
    reviewFormPage,
    reviewPage,
  }) => {
    const { externalId, companyId } = uniqueReviewIdentity('Mobile Clear Test');

    await reviewFormPage.goto();
    await reviewFormPage.submit({ externalId, companyId, comment: 'Ok.' });
    await reviewPage.goto();

    await reviewPage.openMobileFilters();
    await reviewPage.searchInMobileDrawer(companyId);
    await reviewPage.applyMobileFilters();
    await expect(reviewPage.mobileFiltersButton).toHaveText('Filtros (1)');

    await reviewPage.openMobileFilters();
    await reviewPage.clearMobileFilters();

    await expect(reviewPage.mobileFiltersButton).toHaveText('Filtros');
  });
});
