import type { CoreReviewListItem } from './CoreReviewListItem';
import type { CorePagination } from './CorePagination';
import type { CoreReviewStatusCounts } from './CoreReviewStatusCounts';

export interface CoreListReviewsResult {
  data: CoreReviewListItem[];
  pagination: CorePagination;
  counts: CoreReviewStatusCounts;
}
