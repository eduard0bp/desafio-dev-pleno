import { test, expect } from './fixtures/test';

test.describe('Navigation', () => {
  test('the sidebar links move between Enviar Avaliação and Monitoramento', async ({ page }) => {
    await page.goto('/admin/avaliacoes');

    await page.getByRole('link', { name: 'Enviar Avaliação' }).click();
    await expect(page).toHaveURL(/\/avaliar$/);
    await expect(page.getByRole('heading', { name: 'Nova avaliação' })).toBeVisible();

    await page.getByRole('link', { name: 'Monitoramento' }).click();
    await expect(page).toHaveURL(/\/admin\/avaliacoes$/);
    await expect(page.getByRole('heading', { name: 'Monitoramento de Feedbacks' })).toBeVisible();
  });

  test('an unknown route redirects to the review listing', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page).toHaveURL(/\/admin\/avaliacoes$/);
  });

  test('the root path redirects to the review listing', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/admin\/avaliacoes$/);
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('the burger menu opens the nav drawer, and navigating closes it', async ({ page }) => {
      await page.goto('/admin/avaliacoes');

      const navLink = page.getByRole('navigation').getByRole('link', { name: 'Enviar Avaliação' });
      await expect(navLink).not.toBeInViewport();

      await page.getByRole('button', { name: 'Abrir menu' }).click();
      await expect(navLink).toBeInViewport();

      await navLink.click();
      await expect(page).toHaveURL(/\/avaliar$/);
    });
  });
});
