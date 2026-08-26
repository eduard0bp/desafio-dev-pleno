export type CoreReviewStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CoreReviewAnalysis {
  sentiment: string;
  category: string;
  confidence: number;
  matched_keywords: string[];
}

export interface CoreReviewLastError {
  message: string;
  code?: string;
}

export interface CoreReviewListItem {
  id: string;
  external_id: string;
  company_id: string;
  rating: number;
  status: CoreReviewStatus;
  analysis: CoreReviewAnalysis | null;
  created_at: Date;
}

export interface CoreReviewDetail extends CoreReviewListItem {
  comment: string;
  attempts: number;
  processed_at: Date | null;
  last_error: CoreReviewLastError | null;
}
