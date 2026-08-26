const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ReviewStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReviewListItem {
  id: string;
  external_id: string;
  rating: number;
  status: ReviewStatus;
  created_at: string;
}

export interface ReviewAnalysis {
  sentiment: string;
  category: string;
  confidence: number;
  matched_keywords: string[];
}

export interface ReviewLastError {
  message: string;
  code?: string;
}

export interface ReviewDetail extends ReviewListItem {
  company_id: string;
  comment: string;
  analysis: ReviewAnalysis | null;
  attempts: number;
  processed_at: string | null;
  last_error: ReviewLastError | null;
}

export interface CreateReviewInput {
  external_id: string;
  company_id: string;
  rating: number;
  comment: string;
}

export interface CreateReviewResult {
  id: string;
  external_id: string;
  status: ReviewStatus;
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return body?.error?.message ?? fallback;
}

export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const response = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao enviar avaliação'));
  }
  return response.json();
}

export async function listReviews(): Promise<ReviewListItem[]> {
  const response = await fetch(`${API_URL}/reviews`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliações'));
  }
  const body = await response.json();
  return body.data;
}

export async function getReview(id: string): Promise<ReviewDetail> {
  const response = await fetch(`${API_URL}/reviews/${id}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliação'));
  }
  return response.json();
}
