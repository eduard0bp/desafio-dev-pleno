import { expect, type Locator, type Page } from '@playwright/test';
import { NotificationBell } from '../../components/notification-bell/notification-bell';
import { dayButtonName } from './review-page-helpers';

export type StatusChipLabel = 'Todos' | 'Pendentes' | 'Processando' | 'Concluídos' | 'Falhas';
export type SentimentLabel = 'Positivo' | 'Neutro' | 'Negativo';

export class ReviewPage {
  readonly page: Page;
  readonly bell: NotificationBell;

  readonly searchInput: Locator;
  readonly minRatingSelect: Locator;
  readonly sentimentSelect: Locator;
  readonly desktopClearFiltersButton: Locator;
  readonly mobileFiltersButton: Locator;
  readonly mobileFiltersDrawer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bell = new NotificationBell(page);

    this.searchInput = page.getByPlaceholder('Buscar por empresa...');
    this.minRatingSelect = page.getByRole('combobox', { name: 'Todas as notas' });
    this.sentimentSelect = page.getByRole('combobox', { name: 'Todos os sentimentos' });
    this.desktopClearFiltersButton = page.getByRole('button', { name: 'Limpar filtros', exact: true });
    this.mobileFiltersButton = page.getByRole('button', { name: /^Filtros/ });
    this.mobileFiltersDrawer = page.getByRole('dialog', { name: 'Filtros' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/avaliacoes');
    await expect(this.page).toHaveURL(/\/admin\/avaliacoes$/);
  }

  statusChip(label: StatusChipLabel): Locator {
    const input = this.page.getByRole('radio', { name: new RegExp(`^${label}`) });
    return input.locator('xpath=following-sibling::label[1]');
  }

  async selectStatusChip(label: StatusChipLabel): Promise<void> {
    await this.statusChip(label).click();
  }

  row(companyId: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(companyId)) });
  }

  viewDetailsButton(companyId: string): Locator {
    return this.row(companyId).getByRole('button', { name: 'Ver detalhes da avaliação' });
  }

  retryButton(companyId: string): Locator {
    return this.row(companyId).getByRole('button', { name: 'Reprocessar avaliação' });
  }

  paginationPage(page: number): Locator {
    return this.page.getByRole('button', { name: String(page), exact: true });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async selectMinRating(label: string): Promise<void> {
    await this.minRatingSelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async selectSentiment(label: SentimentLabel): Promise<void> {
    await this.sentimentSelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async pickDateFrom(date: Date): Promise<void> {
    await this.page.getByRole('button', { name: 'Data inicial' }).click();
    await this.page.getByRole('button', { name: dayButtonName(date), exact: true }).click();
  }

  async pickDateTo(date: Date): Promise<void> {
    await this.page.getByRole('button', { name: 'Data final' }).click();
    await this.page.getByRole('button', { name: dayButtonName(date), exact: true }).click();
  }

  async clearFiltersDesktop(): Promise<void> {
    await this.desktopClearFiltersButton.click();
  }

  async openMobileFilters(): Promise<void> {
    await this.mobileFiltersButton.click();
    await expect(this.mobileFiltersDrawer).toBeVisible();
  }

  async searchInMobileDrawer(term: string): Promise<void> {
    await this.mobileFiltersDrawer.getByPlaceholder('Buscar por empresa...').fill(term);
  }

  async applyMobileFilters(): Promise<void> {
    await this.mobileFiltersDrawer.getByRole('button', { name: 'Aplicar filtros' }).click();
    await expect(this.mobileFiltersDrawer).not.toBeVisible();
  }

  async clearMobileFilters(): Promise<void> {
    await this.mobileFiltersDrawer.getByRole('button', { name: 'Limpar filtros' }).click();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
