import type {
  CoreReviewDetail,
  CoreCreateReviewInput,
  CoreCreateReviewResult,
  CoreListReviewsParams,
  CoreListReviewsResult,
  CoreRetryReviewResult,
  CoreMarkReviewReadResult,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return body?.error?.message ?? fallback;
}

async function requestJson<T>(url: string, options: RequestInit | undefined, fallbackMessage: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }
  return response.json();
}

export async function createReview(input: CoreCreateReviewInput): Promise<CoreCreateReviewResult> {
  return requestJson(
    `${API_URL}/reviews`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Falha ao enviar avaliação'
  );
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
  if (params.sentiment) query.set('sentiment', params.sentiment);
  if (params.isRead != null) query.set('isRead', String(params.isRead));
  return query.toString();
}

export async function listReviews(params: CoreListReviewsParams): Promise<CoreListReviewsResult> {
  return requestJson(`${API_URL}/reviews?${buildListReviewsQuery(params)}`, undefined, 'Falha ao carregar avaliações');
}

export async function getReview(id: string): Promise<CoreReviewDetail> {
  return requestJson(`${API_URL}/reviews/${id}`, undefined, 'Falha ao carregar avaliação');
}

export async function retryReview(id: string): Promise<CoreRetryReviewResult> {
  return requestJson(`${API_URL}/reviews/${id}/retry`, { method: 'POST' }, 'Falha ao reprocessar avaliação');
}

export async function markReviewAsRead(id: string): Promise<CoreMarkReviewReadResult> {
  return requestJson(`${API_URL}/reviews/${id}/read`, { method: 'POST' }, 'Falha ao marcar avaliação como lida');
}
