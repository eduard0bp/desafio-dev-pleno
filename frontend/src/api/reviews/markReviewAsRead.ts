import type { CoreMarkReviewReadResult } from '../../types';
import { API_URL, requestJson } from '../httpClient';

export async function markReviewAsRead(id: string): Promise<CoreMarkReviewReadResult> {
  return requestJson(`${API_URL}/reviews/${id}/read`, { method: 'POST' }, 'Falha ao marcar avaliação como lida');
}
