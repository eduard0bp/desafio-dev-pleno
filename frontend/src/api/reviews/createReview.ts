import type { CoreCreateReviewInput, CoreCreateReviewResult } from '../../types';
import { API_URL, requestJson } from '../httpClient';

export async function createReview(input: CoreCreateReviewInput): Promise<CoreCreateReviewResult> {
  return requestJson(
    `${API_URL}/reviews`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Falha ao enviar avaliação',
  );
}
