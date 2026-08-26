import type { CoreReviewListItem } from './CoreReviewListItem';
import type { CoreReviewLastError } from './CoreReviewLastError';

export interface CoreReviewDetail extends CoreReviewListItem {
  comment: string;
  attempts: number;
  processed_at: string | null;
  last_error: CoreReviewLastError | null;
}
