import { test, expect } from '@playwright/test';

test('submits a review and follows its status until completion', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Enviar Avaliação' }).click();
  await expect(page).toHaveURL(/\/avaliar$/);

  const externalId = `e2e-${Date.now()}`;
  const companyName = `Empresa E2E ${Date.now()}`;
  await page.getByLabel('ID do pedido').fill(externalId);
  await page.getByLabel('Empresa').fill(companyName);
  await page.getByLabel('Comentário').fill('Chegou frio e atrasado, muito ruim.');
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();

  await page.getByRole('link', { name: 'Monitoramento' }).click();
  await expect(page).toHaveURL(/\/admin\/avaliacoes$/);

  const row = page.getByRole('row').filter({ hasText: companyName });
  await expect(row).toBeVisible();
  await expect(row.getByText('Pendente').or(row.getByText('Processando'))).toBeVisible();

  await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });

  await row.click();
  const detail = page.getByRole('dialog').getByText('Chegou frio e atrasado, muito ruim.');
  await expect(detail).toBeVisible();
});
