import type {
  CoreReviewListItem,
  CoreReviewDetail,
  CoreCreateReviewInput,
  CoreCreateReviewResult,
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

export async function listReviews(): Promise<CoreReviewListItem[]> {
  const response = await fetch(`${API_URL}/reviews`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliações'));
  }
  const body = await response.json();
  return body.data;
}

export async function getReview(id: string): Promise<CoreReviewDetail> {
  const response = await fetch(`${API_URL}/reviews/${id}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Falha ao carregar avaliação'));
  }
  return response.json();
}
