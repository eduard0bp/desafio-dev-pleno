export interface CoreReviewAnalysis {
  sentiment: string;
  category: string;
  confidence: number;
  matched_keywords: string[];
}
