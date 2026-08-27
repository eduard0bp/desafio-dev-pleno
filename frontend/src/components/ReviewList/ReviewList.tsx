import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Chip,
  Drawer,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  Pagination,
  Rating,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { IconAlertTriangle, IconFilter, IconFilterOff, IconInbox } from '@tabler/icons-react';
import { useReviewsQuery, useRetryReviewMutation } from '../../hooks';
import { SENTIMENT_LABELS, CATEGORY_LABELS } from '../../constants';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { ReviewDetailPanel } from '../ReviewDetailPanel/ReviewDetailPanel';
import { TableStateMessage } from '../TableStateMessage/TableStateMessage';
import { useReviewFilters, type StatusFilterValue } from './hooks/useReviewFilters';
import type { CoreReviewStatusCounts } from '../../types';
import classes from './ReviewList.module.css';

type ReviewFilters = ReturnType<typeof useReviewFilters>;

function FilterFields({ filters }: { filters: ReviewFilters }) {
  return (
    <>
      <TextInput
        placeholder="Buscar por empresa..."
        value={filters.search}
        onChange={(event) => filters.setSearch(event.currentTarget.value)}
        w={{ base: '100%', xs: 240 }}
      />
      <Select
        placeholder="Todas as notas"
        data={RATING_OPTIONS}
        value={filters.minRating != null ? String(filters.minRating) : null}
        onChange={(value) => filters.setMinRating(value ? Number(value) : null)}
        w={{ base: '100%', xs: 180 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data inicial"
        value={filters.dateFrom}
        onChange={(value) => filters.setDateFrom(value as Date | null)}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data final"
        value={filters.dateTo}
        onChange={(value) => filters.setDateTo(value as Date | null)}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
    </>
  );
}

const GRID_TEMPLATE_COLUMNS = '2fr 1.3fr 1fr 1fr 1fr 1fr 1fr';
const COLUMN_LABELS = ['Empresa', 'Nota', 'Status', 'Sentimento', 'Categoria', 'Data', 'Ações'];
// Badge/StatusBadge are inline-level elements — wrapped in a plain block Box,
// their surrounding line-height leaves phantom space that shifts them a few
// pixels off-center relative to plain <Text> cells. Flex removes that gap.
const CELL_FLEX_STYLE = { display: 'flex', alignItems: 'center' } as const;

const STATUS_CHIPS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'failed', label: 'Falhas' },
];

const RATING_OPTIONS = [
  { value: '5', label: '5 estrelas' },
  { value: '4', label: '4+ estrelas' },
  { value: '3', label: '3+ estrelas' },
  { value: '2', label: '2+ estrelas' },
  { value: '1', label: '1+ estrela' },
];

const EMPTY_COUNTS: CoreReviewStatusCounts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

const PAGE_SIZE = 10;

export function ReviewList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false);
  const filters = useReviewFilters();
  const retryMutation = useRetryReviewMutation();

  const { data, isLoading, isError, error } = useReviewsQuery({
    page: filters.page,
    pageSize: PAGE_SIZE,
    status: filters.status === 'all' ? undefined : filters.status,
    minRating: filters.minRating ?? undefined,
    search: filters.debouncedSearch || undefined,
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
  });

  // Only the very first load (no data yet, of any kind) replaces the whole
  // page with a spinner. Every other state — an error, an empty result, a
  // page of reviews — renders inside the persistent filters/table shell
  // below, so the controls never disappear from under the user.
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
    filters.dateTo != null;

  const activeFieldFilterCount = [
    filters.debouncedSearch !== '',
    filters.minRating != null,
    filters.dateFrom != null,
    filters.dateTo != null,
  ].filter(Boolean).length;

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

      <Chip.Group value={filters.status} onChange={(value) => filters.setStatus(value as StatusFilterValue)}>
        <Group gap="xs" wrap="wrap">
          {STATUS_CHIPS.map((chip) => (
            <Chip key={chip.value} value={chip.value} variant="filled" color="primary">
              {chip.label} ({counts[chip.value]})
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      <Button
        hiddenFrom="sm"
        variant="light"
        color="tertiary"
        leftSection={<IconFilter size={16} />}
        onClick={openFilters}
      >
        Filtros{activeFieldFilterCount > 0 ? ` (${activeFieldFilterCount})` : ''}
      </Button>

      <Group gap="sm" wrap="wrap" visibleFrom="sm">
        <FilterFields filters={filters} />
      </Group>

      <Drawer
        opened={filtersOpened}
        onClose={closeFilters}
        position="top"
        title="Filtros"
        hiddenFrom="sm"
        styles={{ content: { height: 'auto' } }}
      >
        <Stack gap="sm">
          <FilterFields filters={filters} />
          <Group gap="sm" grow>
            <Button variant="default" onClick={filters.clearFieldFilters}>
              Limpar filtros
            </Button>
            <Button color="tertiary" onClick={closeFilters}>
              Aplicar filtros
            </Button>
          </Group>
        </Stack>
      </Drawer>

      <Box style={{ overflowX: 'auto' }}>
        <Box role="table" miw={640} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)' }}>
          <Box role="rowgroup">
            <Box
              role="row"
              px="md"
              style={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE_COLUMNS, gap: 'var(--mantine-spacing-sm)' }}
            >
              {COLUMN_LABELS.map((label) => (
                <Text key={label} role="columnheader" size="sm" fw={600} c="dimmed">
                  {label}
                </Text>
              ))}
            </Box>
          </Box>

          <Box role="rowgroup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)' }}>
            {isError ? (
              <Paper withBorder radius="md" p="md">
                <TableStateMessage
                  icon={<IconAlertTriangle size={24} />}
                  color="red"
                  title={(error as Error).message}
                  description="Tente novamente em instantes."
                />
              </Paper>
            ) : reviews.length === 0 ? (
              <Paper withBorder radius="md" p="md">
                <TableStateMessage
                  icon={hasActiveFilters ? <IconFilterOff size={24} /> : <IconInbox size={24} />}
                  title={emptyStateMessage}
                  description={
                    hasActiveFilters
                      ? 'Tente ajustar ou limpar os filtros aplicados.'
                      : 'Assim que uma avaliação for cadastrada, ela aparece aqui.'
                  }
                />
              </Paper>
            ) : (
              reviews.map((review) => {
                const sentiment = review.analysis ? SENTIMENT_LABELS[review.analysis.sentiment] : undefined;
                const category = review.analysis
                  ? (CATEGORY_LABELS[review.analysis.category] ?? review.analysis.category)
                  : undefined;
                return (
                  <Paper
                    key={review.id}
                    role="row"
                    withBorder
                    radius="md"
                    p="sm"
                    className={classes.row}
                    onClick={() => setSelectedId(review.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
                      gap: 'var(--mantine-spacing-sm)',
                      alignItems: 'center',
                    }}
                  >
                    <Box role="cell" miw={0}>
                      <Text size="sm" fw={500} truncate="end">
                        {review.company_id}
                      </Text>
                      <Text size="xs" c="dimmed" truncate="end">
                        {review.comment}
                      </Text>
                    </Box>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      <Rating value={review.rating} color="tertiary" size="sm" readOnly />
                    </Box>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      <StatusBadge status={review.status} />
                    </Box>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      {sentiment ? (
                        <Badge color={sentiment.color}>{sentiment.label}</Badge>
                      ) : (
                        <Text c="dimmed" size="sm">
                          —
                        </Text>
                      )}
                    </Box>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      {category ? (
                        <Text size="sm">{category}</Text>
                      ) : (
                        <Text c="dimmed" size="sm">
                          —
                        </Text>
                      )}
                    </Box>
                    <Text role="cell" size="sm" c="dimmed">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      {review.status === 'failed' ? (
                        <Button
                          size="xs"
                          variant="light"
                          color="tertiary"
                          loading={retryMutation.isPending && retryMutation.variables === review.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            retryMutation.mutate(review.id);
                          }}
                        >
                          Reprocessar
                        </Button>
                      ) : (
                        <Text c="dimmed" size="sm">
                          —
                        </Text>
                      )}
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {!isError && pagination && pagination.total > 0 && (
        <Flex direction={{ base: 'column', xs: 'row' }} justify={{ base: 'center', xs: 'space-between' }} align="center" gap="sm">
          <Text size="sm" c="dimmed">
            Mostrando {rangeStart}-{rangeEnd} de {pagination.total} avaliações
          </Text>
          <Pagination total={pagination.totalPages} value={pagination.page} onChange={filters.setPage} radius="md" />
        </Flex>
      )}

      <Modal opened={selectedId != null} onClose={() => setSelectedId(null)} title="Detalhe da avaliação" centered>
        {selectedId && <ReviewDetailPanel reviewId={selectedId} />}
      </Modal>
    </Stack>
  );
}
