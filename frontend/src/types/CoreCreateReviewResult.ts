import type { CoreReviewStatus } from './CoreReviewStatus';

export interface CoreCreateReviewResult {
  id: string;
  external_id: string;
  status: CoreReviewStatus;
}
