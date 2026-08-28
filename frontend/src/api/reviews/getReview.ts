import type { CoreReviewDetail } from '../../types';
import { API_URL, requestJson } from '../httpClient';

export async function getReview(id: string): Promise<CoreReviewDetail> {
  return requestJson(`${API_URL}/reviews/${id}`, undefined, 'Falha ao carregar avaliação');
}
