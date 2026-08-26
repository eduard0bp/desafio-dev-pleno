import { useState } from 'react';
import {
  Alert,
  Badge,
  Chip,
  Flex,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useReviewsQuery } from '../../hooks';
import { SENTIMENT_LABELS, CATEGORY_LABELS } from '../../constants';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { ReviewDetailPanel } from '../ReviewDetailPanel/ReviewDetailPanel';
import { useReviewFilters, type StatusFilterValue } from './hooks/useReviewFilters';

const STATUS_CHIPS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'failed', label: 'Falhas' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Todas as notas' },
  { value: '5', label: '5 estrelas' },
  { value: '4', label: '4+ estrelas' },
  { value: '3', label: '3+ estrelas' },
  { value: '2', label: '2+ estrelas' },
  { value: '1', label: '1+ estrela' },
];

const PAGE_SIZE = 10;

export function ReviewList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filters = useReviewFilters();

  const { data, isLoading, isError, error } = useReviewsQuery({
    page: filters.page,
    pageSize: PAGE_SIZE,
    status: filters.status === 'all' ? undefined : filters.status,
    minRating: filters.minRating ?? undefined,
    search: filters.debouncedSearch || undefined,
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
  });

  if (isLoading) return <Loader />;
  if (isError) return <Alert color="red">{(error as Error).message}</Alert>;
  if (!data) return null;

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.minRating != null ||
    filters.debouncedSearch !== '' ||
    filters.dateFrom != null ||
    filters.dateTo != null;

  if (data.pagination.total === 0 && !hasActiveFilters) {
    return <Text c="dimmed">Nenhuma avaliação cadastrada ainda.</Text>;
  }

  const rangeStart = (data.pagination.page - 1) * data.pagination.pageSize + 1;
  const rangeEnd = Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total);

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
              {chip.label} ({data.counts[chip.value]})
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar por empresa..."
          value={filters.search}
          onChange={(event) => filters.setSearch(event.currentTarget.value)}
          w={{ base: '100%', xs: 240 }}
        />
        <Select
          placeholder="Todas as notas"
          data={RATING_OPTIONS}
          value={filters.minRating != null ? String(filters.minRating) : ''}
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
      </Group>

      {data.pagination.total === 0 ? (
        <Text c="dimmed">Nenhuma avaliação encontrada para os filtros selecionados.</Text>
      ) : (
        <>
          <Table.ScrollContainer minWidth={640}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Empresa</Table.Th>
                  <Table.Th>Nota</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Sentimento</Table.Th>
                  <Table.Th>Categoria</Table.Th>
                  <Table.Th>Data</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.data.map((review) => {
                  const sentiment = review.analysis ? SENTIMENT_LABELS[review.analysis.sentiment] : undefined;
                  const category = review.analysis
                    ? (CATEGORY_LABELS[review.analysis.category] ?? review.analysis.category)
                    : undefined;
                  return (
                    <Table.Tr key={review.id} onClick={() => setSelectedId(review.id)} style={{ cursor: 'pointer' }}>
                      <Table.Td>{review.company_id}</Table.Td>
                      <Table.Td>{review.rating} ★</Table.Td>
                      <Table.Td>
                        <StatusBadge status={review.status} />
                      </Table.Td>
                      <Table.Td>
                        {sentiment ? (
                          <Badge color={sentiment.color}>{sentiment.label}</Badge>
                        ) : (
                          <Text c="dimmed" size="sm">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {category ?? (
                          <Text c="dimmed" size="sm">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>{new Date(review.created_at).toLocaleDateString('pt-BR')}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Flex direction={{ base: 'column', xs: 'row' }} justify={{ base: 'center', xs: 'space-between' }} align="center" gap="sm">
            <Text size="sm" c="dimmed">
              Mostrando {rangeStart}-{rangeEnd} de {data.pagination.total} avaliações
            </Text>
            <Pagination total={data.pagination.totalPages} value={data.pagination.page} onChange={filters.setPage} />
          </Flex>
        </>
      )}

      <Modal opened={selectedId != null} onClose={() => setSelectedId(null)} title="Detalhe da avaliação" centered>
        {selectedId && <ReviewDetailPanel reviewId={selectedId} />}
      </Modal>
    </Stack>
  );
}
