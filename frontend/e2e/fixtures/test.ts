import { test as base } from '@playwright/test';
import { ReviewFormPage } from '../pages/review-form-page/review-form-page';
import { ReviewPage } from '../pages/review-page/review-page';
import { ReviewDetailModal } from '../components/review-detail-modal/review-detail-modal';

interface Fixtures {
  reviewFormPage: ReviewFormPage;
  reviewPage: ReviewPage;
  reviewDetailModal: ReviewDetailModal;
}

export const test = base.extend<Fixtures>({
  reviewFormPage: async ({ page }, use) => {
    await use(new ReviewFormPage(page));
  },
  reviewPage: async ({ page }, use) => {
    await use(new ReviewPage(page));
  },
  reviewDetailModal: async ({ page }, use) => {
    await use(new ReviewDetailModal(page));
  },
});

export { expect } from '@playwright/test';
