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

/**
 * There's no alerting/notification infra in this challenge's scope, so a
 * structured log line is the alert: easy to grep, and a real pipeline
 * (log shipper, alerting rule) can pick "negative_review_detected" up
 * without any code change here.
 */
export function alertNegativeReview(input: NegativeReviewAlertInput): void {
  log('warn', 'negative_review_detected', { ...input });
}
