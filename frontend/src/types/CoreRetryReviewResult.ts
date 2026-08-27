import type { CoreReviewStatus } from './CoreReviewStatus';

export interface CoreRetryReviewResult {
  id: string;
  external_id: string;
  status: CoreReviewStatus;
}
