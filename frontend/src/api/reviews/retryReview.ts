import type { CoreRetryReviewResult } from '../../types';
import { API_URL, requestJson } from '../httpClient';

export async function retryReview(id: string): Promise<CoreRetryReviewResult> {
  return requestJson(`${API_URL}/reviews/${id}/retry`, { method: 'POST' }, 'Falha ao reprocessar avaliação');
}
