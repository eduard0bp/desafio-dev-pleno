import type { CoreReviewListItem } from './reviewListItem';
import type { CoreReviewLastError } from './reviewLastError';

export interface CoreReviewDetail extends CoreReviewListItem {
  comment: string;
  attempts: number;
  processed_at: Date | null;
  last_error: CoreReviewLastError | null;
}
