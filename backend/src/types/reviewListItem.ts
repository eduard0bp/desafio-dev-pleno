import type { CoreReviewStatus } from './reviewStatus';
import type { CoreReviewAnalysis } from './reviewAnalysis';

export interface CoreReviewListItem {
  id: string;
  external_id: string;
  company_id: string;
  rating: number;
  status: CoreReviewStatus;
  analysis: CoreReviewAnalysis | null;
  created_at: Date;
}
