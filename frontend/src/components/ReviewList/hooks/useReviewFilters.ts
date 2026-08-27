import { useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { CoreReviewStatus, CoreReviewSentiment } from '../../../types';

export type StatusFilterValue = 'all' | CoreReviewStatus;

const SEARCH_DEBOUNCE_MS = 400;

export function useReviewFilters() {
  const [search, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [status, setStatusValue] = useState<StatusFilterValue>('all');
  const [minRating, setMinRatingValue] = useState<number | null>(null);
  const [dateFrom, setDateFromValue] = useState<Date | null>(null);
  const [dateTo, setDateToValue] = useState<Date | null>(null);
  const [sentiment, setSentimentValue] = useState<CoreReviewSentiment | null>(null);
  const [page, setPage] = useState(1);

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

  function setDateFrom(value: Date | null) {
    setDateFromValue(value);
    setPage(1);
  }

  function setDateTo(value: Date | null) {
    setDateToValue(value);
    setPage(1);
  }

  function setSentiment(value: CoreReviewSentiment | null) {
    setSentimentValue(value);
    setPage(1);
  }

  function clearFieldFilters() {
    setSearch('');
    setMinRating(null);
    setDateFrom(null);
    setDateTo(null);
    setSentiment(null);
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus,
    minRating,
    setMinRating,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sentiment,
    setSentiment,
    page,
    setPage,
    clearFieldFilters,
  };
}
