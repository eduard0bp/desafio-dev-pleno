import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://falae:falae@localhost:5432/falae?schema=public';

// Each run creates a real review through the running stack (not a mock), so
// without cleanup the dev database grows by one row per run indefinitely.
async function deleteReviewByExternalId(externalId: string): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM reviews WHERE external_id = $1', [externalId]);
  } finally {
    await client.end();
  }
}

test('submits a review and follows its status until completion', async ({ page }) => {
  const externalId = `e2e-${Date.now()}`;

  try {
    await page.goto('/');

    await page.getByRole('link', { name: 'Enviar Avaliação' }).click();
    await expect(page).toHaveURL(/\/avaliar$/);

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
  } finally {
    await deleteReviewByExternalId(externalId);
  }
});
