import { useState } from 'react';
import { Alert, Badge, Chip, Flex, Group, Loader, Pagination, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useReviewsQuery } from '../../hooks';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { ReviewDetailPanel } from '../ReviewDetailPanel/ReviewDetailPanel';
import { useReviewFilters, type StatusFilterValue } from './hooks/useReviewFilters';

const SENTIMENT_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: 'Positivo', color: 'green' },
  neutral: { label: 'Neutro', color: 'neutral' },
  negative: { label: 'Negativo', color: 'red' },
};

const CATEGORY_LABELS: Record<string, string> = {
  delivery: 'Entrega',
  service: 'Atendimento',
  food: 'Comida',
  price: 'Preço',
  environment: 'Ambiente',
  general: 'Geral',
};

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
  const { data, isLoading, isError, error } = useReviewsQuery();
  const filters = useReviewFilters(data ?? [], PAGE_SIZE);

  if (isLoading) return <Loader />;
  if (isError) return <Alert color="red">{(error as Error).message}</Alert>;
  if (!data || data.length === 0) return <Text c="dimmed">Nenhuma avaliação cadastrada ainda.</Text>;

  const rangeStart = (filters.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filters.page * PAGE_SIZE, filters.filteredCount);

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
              {chip.label} ({filters.counts[chip.value]})
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
          type="range"
          placeholder="Período"
          value={filters.dateRange}
          onChange={(value) => filters.setDateRange(value as [Date | null, Date | null])}
          w={{ base: '100%', xs: 260 }}
          clearable
        />
      </Group>

      {filters.filteredCount === 0 ? (
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
                {filters.reviews.map((review) => {
                  const sentiment = review.analysis ? SENTIMENT_LABELS[review.analysis.sentiment] : undefined;
                  const category = review.analysis ? CATEGORY_LABELS[review.analysis.category] ?? review.analysis.category : undefined;
                  return (
                    <Table.Tr key={review.id} onClick={() => setSelectedId(review.id)} style={{ cursor: 'pointer' }}>
                      <Table.Td>{review.company_id}</Table.Td>
                      <Table.Td>{review.rating} ★</Table.Td>
                      <Table.Td>
                        <StatusBadge status={review.status} />
                      </Table.Td>
                      <Table.Td>
                        {sentiment ? <Badge color={sentiment.color}>{sentiment.label}</Badge> : <Text c="dimmed" size="sm">—</Text>}
                      </Table.Td>
                      <Table.Td>{category ?? <Text c="dimmed" size="sm">—</Text>}</Table.Td>
                      <Table.Td>{new Date(review.created_at).toLocaleDateString('pt-BR')}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Flex
            direction={{ base: 'column', xs: 'row' }}
            justify={{ base: 'center', xs: 'space-between' }}
            align="center"
            gap="sm"
          >
            <Text size="sm" c="dimmed">
              Mostrando {rangeStart}-{rangeEnd} de {filters.filteredCount} avaliações
            </Text>
            <Pagination total={filters.totalPages} value={filters.page} onChange={filters.setPage} />
          </Flex>
        </>
      )}

      {selectedId && <ReviewDetailPanel reviewId={selectedId} />}
    </Stack>
  );
}
