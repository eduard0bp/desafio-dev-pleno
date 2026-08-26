import { useMemo, useState } from 'react';
import type { CoreReviewListItem, CoreReviewStatus } from '../../../types';

export type StatusFilterValue = 'all' | CoreReviewStatus;

export interface ReviewStatusCounts {
  all: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface ReviewFilterValues {
  search: string;
  status: StatusFilterValue;
  minRating: number | null;
  dateRange: [Date | null, Date | null];
}

const EMPTY_COUNTS: ReviewStatusCounts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

export function computeStatusCounts(reviews: CoreReviewListItem[]): ReviewStatusCounts {
  return reviews.reduce((counts, review) => {
    counts.all += 1;
    counts[review.status] += 1;
    return counts;
  }, { ...EMPTY_COUNTS });
}

export function filterReviews(reviews: CoreReviewListItem[], filters: ReviewFilterValues): CoreReviewListItem[] {
  const search = filters.search.trim().toLowerCase();
  const [from, to] = filters.dateRange;

  return reviews.filter((review) => {
    if (filters.status !== 'all' && review.status !== filters.status) return false;
    if (filters.minRating != null && review.rating < filters.minRating) return false;
    if (search && !review.company_id.toLowerCase().includes(search)) return false;

    const createdAt = new Date(review.created_at);
    if (from && createdAt < from) return false;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (createdAt > endOfDay) return false;
    }

    return true;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

const DEFAULT_PAGE_SIZE = 10;

export function useReviewFilters(reviews: CoreReviewListItem[], pageSize = DEFAULT_PAGE_SIZE) {
  const [search, setSearchValue] = useState('');
  const [status, setStatusValue] = useState<StatusFilterValue>('all');
  const [minRating, setMinRatingValue] = useState<number | null>(null);
  const [dateRange, setDateRangeValue] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => computeStatusCounts(reviews), [reviews]);

  const filtered = useMemo(
    () => filterReviews(reviews, { search, status, minRating, dateRange }),
    [reviews, search, status, minRating, dateRange]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => paginate(filtered, currentPage, pageSize), [filtered, currentPage, pageSize]);

  function setSearch(value: string) {
    setSearchValue(value);
    setPage(1);
  }

  function setStatus(value: StatusFilterValue) {
    setStatusValue(value);
    setPage(1);
  }

  function setMinRating(value: number | null) {
    setMinRatingValue(value);
    setPage(1);
  }

  function setDateRange(value: [Date | null, Date | null]) {
    setDateRangeValue(value);
    setPage(1);
  }

  return {
    search,
    setSearch,
    status,
    setStatus,
    minRating,
    setMinRating,
    dateRange,
    setDateRange,
    page: currentPage,
    setPage,
    totalPages,
    counts,
    filteredCount: filtered.length,
    reviews: paginated,
  };
}
