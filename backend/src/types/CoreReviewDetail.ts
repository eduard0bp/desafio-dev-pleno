import type { CoreReviewListItem } from './CoreReviewListItem';
import type { CoreReviewLastError } from './CoreReviewLastError';

export interface CoreReviewDetail extends CoreReviewListItem {
  comment: string;
  attempts: number;
  processed_at: Date | null;
  last_error: CoreReviewLastError | null;
}
