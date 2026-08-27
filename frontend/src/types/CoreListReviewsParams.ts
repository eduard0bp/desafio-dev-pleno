import type { CoreReviewStatus } from './CoreReviewStatus';
import type { CoreReviewSentiment } from './CoreReviewSentiment';

export interface CoreListReviewsParams {
  page: number;
  pageSize: number;
  status?: CoreReviewStatus;
  minRating?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sentiment?: CoreReviewSentiment;
  isRead?: boolean;
}
