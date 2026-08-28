import { Center, Flex, Loader, Pagination, Stack, Text, Title } from '@mantine/core';
import { useReviewsQuery, useRetryReviewMutation } from '../../hooks';
import { useReviewFilters } from './hooks/useReviewFilters';
import { useDraftFilters } from './hooks/useDraftFilters';
import { useSelectedReview } from '../../context/SelectedReviewContext';
import type { CoreReviewStatusCounts } from '../../types';
import { ReviewFilters } from '../ReviewFilters/ReviewFilters';
import { ReviewTable } from '../ReviewTable/ReviewTable';

const EMPTY_COUNTS: CoreReviewStatusCounts = {
  all: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
};

const PAGE_SIZE = 10;

export function ReviewList() {
  const filters = useReviewFilters();
  const draftFilters = useDraftFilters(filters);
  const retryMutation = useRetryReviewMutation();
  const { openReview } = useSelectedReview();

  const { data, isLoading, isError, error } = useReviewsQuery({
    page: filters.page,
    pageSize: PAGE_SIZE,
    status: filters.status === 'all' ? undefined : filters.status,
    minRating: filters.minRating ?? undefined,
    search: filters.debouncedSearch || undefined,
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
    sentiment: filters.sentiment ?? undefined,
  });

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.minRating != null ||
    filters.debouncedSearch !== '' ||
    filters.dateFrom != null ||
    filters.dateTo != null ||
    filters.sentiment != null;

  const emptyStateMessage = hasActiveFilters
    ? 'Nenhuma avaliação encontrada para os filtros selecionados.'
    : 'Nenhuma avaliação cadastrada ainda.';

  const counts = data?.counts ?? EMPTY_COUNTS;
  const reviews = data?.data ?? [];
  const pagination = data?.pagination;

  const rangeStart = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : 0;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Monitoramento de Feedbacks</Title>
        <Text size="sm" c="dimmed">
          Monitore e analise o feedback das empresas parceiras.
        </Text>
      </Stack>

      <ReviewFilters filters={filters} draft={draftFilters} counts={counts} />

      <ReviewTable
        reviews={reviews}
        isError={isError}
        error={error}
        hasActiveFilters={hasActiveFilters}
        emptyStateMessage={emptyStateMessage}
        retryMutation={retryMutation}
        onOpenReview={openReview}
      />

      {!isError && pagination && pagination.total > 0 && (
        <Flex
          direction={{ base: 'column', xs: 'row' }}
          justify={{ base: 'center', xs: 'space-between' }}
          align="center"
          gap="sm"
        >
          <Text size="sm" c="dimmed">
            Mostrando {rangeStart}-{rangeEnd} de {pagination.total} avaliações
          </Text>
          <Pagination total={pagination.totalPages} value={pagination.page} onChange={filters.setPage} radius="md" />
        </Flex>
      )}
    </Stack>
  );
}
