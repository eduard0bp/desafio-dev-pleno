import { log } from '../lib/logger';

export interface NegativeReviewAlertInput {
  reviewId: string;
  externalId: string;
  companyId: string;
  rating: number;
  sentiment: string;
  category: string;
  confidence: number;
}

export function alertNegativeReview(input: NegativeReviewAlertInput): void {
  log('warn', 'negative_review_detected', { ...input });
}
