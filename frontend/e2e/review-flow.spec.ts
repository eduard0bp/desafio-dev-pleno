import { test, expect } from '@playwright/test';

test('submits a review and follows its status until completion', async ({ page }) => {
  await page.goto('/');

  const externalId = `e2e-${Date.now()}`;
  await page.getByLabel('ID do pedido').fill(externalId);
  await page.getByLabel('Empresa').fill('company-e2e');
  await page.getByLabel('Comentário').fill('Chegou frio e atrasado, muito ruim.');
  await page.getByRole('button', { name: 'Enviar avaliação' }).click();

  const row = page.getByRole('row').filter({ hasText: externalId });
  await expect(row).toBeVisible();
  await expect(row.getByText('Pendente').or(row.getByText('Processando'))).toBeVisible();

  await expect(row.getByText('Concluído').or(row.getByText('Falhou'))).toBeVisible({ timeout: 30000 });

  await row.click();
  const detail = page.getByText('Chegou frio e atrasado, muito ruim.');
  await expect(detail).toBeVisible();
});
