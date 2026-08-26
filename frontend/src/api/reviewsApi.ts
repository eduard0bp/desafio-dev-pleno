import type {
  CoreReviewDetail,
  CoreCreateReviewInput,
  CoreCreateReviewResult,
  CoreListReviewsParams,
  CoreListReviewsResult,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return body?.error?.message ?? fallback;
}

export async function createReview(input: CoreCreateReviewInput): Promise<CoreCreateReviewResult> {
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

function buildListReviewsQuery(params: CoreListReviewsParams): string {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));
  if (params.status) query.set('status', params.status);
  if (params.minRating != null) query.set('minRating', String(params.minRating));
  if (params.search) query.set('search', params.search);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom.toISOString());
  if (params.dateTo) query.set('dateTo', params.dateTo.toISOString());
  return query.toString();
}

export async function listReviews(params: CoreListReviewsParams): Promise<CoreListReviewsResult> {
  const response = await fetch(`${API_URL}/reviews?${buildListReviewsQuery(params)}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliações'));
  }
  return response.json();
}

export async function getReview(id: string): Promise<CoreReviewDetail> {
  const response = await fetch(`${API_URL}/reviews/${id}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliação'));
  }
  return response.json();
}
