import type { CoreListReviewsParams, CoreListReviewsResult } from '../../types';
import { API_URL, requestJson } from '../httpClient';

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
