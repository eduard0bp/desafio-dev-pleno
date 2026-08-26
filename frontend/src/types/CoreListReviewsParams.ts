import type { CoreReviewStatus } from './CoreReviewStatus';

export interface CoreListReviewsParams {
  page: number;
  pageSize: number;
  status?: CoreReviewStatus;
  minRating?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
