import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Chip,
  Drawer,
  Flex,
  Group,
  Loader,
  Paper,
  Pagination,
  Rating,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput, type DateValue } from '@mantine/dates';
import { IconAlertTriangle, IconEye, IconFilter, IconFilterOff, IconInbox, IconRefresh } from '@tabler/icons-react';
import { useReviewsQuery, useRetryReviewMutation } from '../../hooks';
import { SENTIMENT_LABELS, CATEGORY_LABELS } from '../../constants';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { TableStateMessage } from '../TableStateMessage/TableStateMessage';
import { useReviewFilters, type StatusFilterValue } from './hooks/useReviewFilters';
import { useSelectedReview } from '../../context/SelectedReviewContext';
import type { CoreReviewStatusCounts, CoreReviewSentiment } from '../../types';
import classes from './ReviewList.module.css';

interface FieldFilterValues {
  search: string;
  minRating: number | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  sentiment: CoreReviewSentiment | null;
}

interface FieldFilterHandlers {
  setSearch: (value: string) => void;
  setMinRating: (value: number | null) => void;
  setDateFrom: (value: Date | null) => void;
  setDateTo: (value: Date | null) => void;
  setSentiment: (value: CoreReviewSentiment | null) => void;
}

// DatePickerInput's onChange hands back a date-only ISO string (not a
// Date), so filter state — and the .toISOString() call in
// buildListReviewsQuery — needs a real Date instance instead. Building it
// from the string's year/month/day (local time) rather than
// `new Date(value)` matters: the latter parses a date-only string as UTC
// midnight, which rolls back to the previous day once formatted in any
// timezone behind UTC (e.g. selecting the 26th would display the 25th).
function toDateOrNull(value: DateValue): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Desktop wires these fields straight to the real filters (applies as you
// type, matching the existing live behavior). The mobile drawer instead
// passes a local draft — see draftFilters in ReviewList — so edits only
// take effect once "Aplicar filtros" is clicked.
function FilterFields({ value, onChange }: { value: FieldFilterValues; onChange: FieldFilterHandlers }) {
  return (
    <>
      <TextInput
        placeholder="Buscar por empresa..."
        value={value.search}
        onChange={(event) => onChange.setSearch(event.currentTarget.value)}
        w={{ base: '100%', xs: 240 }}
      />
      <Select
        placeholder="Todas as notas"
        data={RATING_OPTIONS}
        value={value.minRating != null ? String(value.minRating) : null}
        onChange={(v) => onChange.setMinRating(v ? Number(v) : null)}
        w={{ base: '100%', xs: 180 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data inicial"
        valueFormat="DD/MM/YYYY"
        value={value.dateFrom}
        onChange={(v) => onChange.setDateFrom(toDateOrNull(v))}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data final"
        valueFormat="DD/MM/YYYY"
        value={value.dateTo}
        onChange={(v) => onChange.setDateTo(toDateOrNull(v))}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
      <Select
        placeholder="Todos os sentimentos"
        data={SENTIMENT_OPTIONS}
        value={value.sentiment}
        onChange={(v) => onChange.setSentiment(v as CoreReviewSentiment | null)}
        w={{ base: '100%', xs: 180 }}
        clearable
      />
    </>
  );
}

// Only Empresa (company name + comment) truncates — every other column gets
// a fixed pixel width wide enough for its longest possible label (badges,
// dates, the star rating), so their text never needs cutting. Empresa keeps
// minmax(…, 1fr) so it fills whatever space is left on wide desktop
// viewports; the fixed columns' combined width (see TABLE_MIN_WIDTH below)
// is what protects narrow viewports instead.
const GRID_TEMPLATE_COLUMNS = 'minmax(160px, 1fr) 110px 120px 100px 110px 90px 60px';
// Sum of every column's minimum (Empresa's 160px floor + the fixed columns),
// plus the row's 6 inter-column gaps and its horizontal padding. Used as an
// explicit min-width instead of CSS `max-content`: `max-content` would ask
// the browser to measure each row's full, untruncated content to size the
// table, and since Empresa is an open-ended 1fr track, one unusually long
// company name would balloon that measurement (and the table's width) far
// past the viewport on both mobile and desktop. A plain numeric floor never
// measures content, so it can't be blown out that way — a name still gets
// truncated at Empresa's actual rendered width, whatever that ends up being.
const TABLE_MIN_WIDTH = 160 + 110 + 120 + 100 + 110 + 90 + 60 + 6 * 10 + 32;
const COLUMN_LABELS = ['Empresa', 'Nota', 'Status', 'Sentimento', 'Categoria', 'Data', 'Ações'];
// Badge/StatusBadge are inline-level elements — wrapped in a plain block Box,
// their surrounding line-height leaves phantom space that shifts them a few
// pixels off-center relative to plain <Text> cells. Flex removes that gap.
// minWidth: 0 overrides the grid item default of min-width: auto — without
// it, each row is its own independent grid, and a row whose cell content is
// wider than its column's fr share pushes that track wider than the same
// column in every other row, breaking alignment down the table.
const CELL_FLEX_STYLE = { display: 'flex', alignItems: 'center', minWidth: 0 } as const;

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

const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positivo' },
  { value: 'neutral', label: 'Neutro' },
  { value: 'negative', label: 'Negativo' },
];

const EMPTY_COUNTS: CoreReviewStatusCounts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

const PAGE_SIZE = 10;

export function ReviewList() {
  const [filtersOpened, { open: openFiltersDisclosure, close: closeFilters }] = useDisclosure(false);
  const filters = useReviewFilters();
  const retryMutation = useRetryReviewMutation();
  const { openReview } = useSelectedReview();

  // The mobile drawer edits this draft instead of the real filters, so
  // typing/picking values doesn't trigger a request until the user taps
  // "Aplicar filtros". Re-seeded from the applied filters every time the
  // drawer opens, so a close-without-applying discards unsaved edits.
  const [draftFilters, setDraftFilters] = useState<FieldFilterValues>({
    search: filters.search,
    minRating: filters.minRating,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sentiment: filters.sentiment,
  });

  function openFilters() {
    setDraftFilters({
      search: filters.search,
      minRating: filters.minRating,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sentiment: filters.sentiment,
    });
    openFiltersDisclosure();
  }

  function applyDraftFilters() {
    filters.setSearch(draftFilters.search);
    filters.setMinRating(draftFilters.minRating);
    filters.setDateFrom(draftFilters.dateFrom);
    filters.setDateTo(draftFilters.dateTo);
    filters.setSentiment(draftFilters.sentiment);
    closeFilters();
  }

  function clearDraftFilters() {
    const empty: FieldFilterValues = { search: '', minRating: null, dateFrom: null, dateTo: null, sentiment: null };
    setDraftFilters(empty);
    filters.clearFieldFilters();
  }

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
    filters.dateTo != null ||
    filters.sentiment != null;

  const activeFieldFilterCount = [
    filters.debouncedSearch !== '',
    filters.minRating != null,
    filters.dateFrom != null,
    filters.dateTo != null,
    filters.sentiment != null,
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

      <Button hiddenFrom="sm" color="tertiary" leftSection={<IconFilter size={16} />} onClick={openFilters}>
        Filtros{activeFieldFilterCount > 0 ? ` (${activeFieldFilterCount})` : ''}
      </Button>

      <Group gap="sm" wrap="wrap" visibleFrom="sm">
        <FilterFields value={filters} onChange={filters} />
        {activeFieldFilterCount > 0 && (
          <Button variant="default" onClick={filters.clearFieldFilters}>
            Limpar filtros
          </Button>
        )}
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
          <FilterFields
            value={draftFilters}
            onChange={{
              setSearch: (value) => setDraftFilters((draft) => ({ ...draft, search: value })),
              setMinRating: (value) => setDraftFilters((draft) => ({ ...draft, minRating: value })),
              setDateFrom: (value) => setDraftFilters((draft) => ({ ...draft, dateFrom: value })),
              setDateTo: (value) => setDraftFilters((draft) => ({ ...draft, dateTo: value })),
              setSentiment: (value) => setDraftFilters((draft) => ({ ...draft, sentiment: value })),
            }}
          />
          <Group gap="sm" grow>
            <Button variant="default" onClick={clearDraftFilters}>
              Limpar filtros
            </Button>
            <Button color="tertiary" onClick={applyDraftFilters}>
              Aplicar filtros
            </Button>
          </Group>
        </Stack>
      </Drawer>

      <Box style={{ overflowX: 'auto' }}>
        {/* Without a min-width here, this flex column collapses to the
            scroll container's available width instead of the columns'
            combined width, and the rows' content (badges, the rating)
            overflows past their card's border instead of the whole table
            scrolling horizontally. See TABLE_MIN_WIDTH above for why this
            is a plain number rather than CSS `max-content`. */}
        <Box
          role="table"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xs)', minWidth: TABLE_MIN_WIDTH }}
        >
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
                    onClick={() => openReview(review.id)}
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
                    <Text role="cell" size="sm" c="dimmed" miw={0}>
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                    <Box role="cell" style={CELL_FLEX_STYLE}>
                      {review.status === 'failed' ? (
                        <Tooltip label="Reprocessar avaliação com falha">
                          <ActionIcon
                            variant="filled"
                            color="tertiary"
                            aria-label="Reprocessar avaliação"
                            loading={retryMutation.isPending && retryMutation.variables === review.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              retryMutation.mutate(review.id);
                            }}
                          >
                            <IconRefresh size={16} />
                          </ActionIcon>
                        </Tooltip>
                      ) : review.status === 'completed' ? (
                        <Tooltip label="Ver detalhes da avaliação">
                          <ActionIcon
                            variant="default"
                            aria-label="Ver detalhes da avaliação"
                            onClick={(event) => {
                              event.stopPropagation();
                              openReview(review.id);
                            }}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
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
    </Stack>
  );
}
