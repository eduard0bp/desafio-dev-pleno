import type { CoreReviewStatus } from './CoreReviewStatus';
import type { CoreReviewAnalysis } from './CoreReviewAnalysis';

export interface CoreReviewListItem {
  id: string;
  external_id: string;
  company_id: string;
  rating: number;
  comment: string;
  status: CoreReviewStatus;
  analysis: CoreReviewAnalysis | null;
  created_at: Date;
}
