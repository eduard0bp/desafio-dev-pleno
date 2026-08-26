import { useState } from 'react';
import { Alert, Loader, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { listReviews, type ReviewListItem } from '../api/reviews';
import { StatusBadge } from './StatusBadge';
import { ReviewDetailPanel } from './ReviewDetailPanel';

const ACTIVE_STATUSES = new Set<ReviewListItem['status']>(['pending', 'processing']);

export function ReviewList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: listReviews,
    retry: false,
    refetchInterval: (query) => {
      const reviews = query.state.data ?? [];
      return reviews.some((r) => ACTIVE_STATUSES.has(r.status)) ? 3000 : false;
    },
  });

  if (isLoading) return <Loader />;
  if (isError) return <Alert color="red">{(error as Error).message}</Alert>;
  if (!data || data.length === 0) return <Text c="dimmed">Nenhuma avaliação cadastrada ainda.</Text>;

  return (
    <>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID do pedido</Table.Th>
            <Table.Th>Nota</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Criado em</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((review) => (
            <Table.Tr key={review.id} onClick={() => setSelectedId(review.id)} style={{ cursor: 'pointer' }}>
              <Table.Td>{review.external_id}</Table.Td>
              <Table.Td>{review.rating}</Table.Td>
              <Table.Td><StatusBadge status={review.status} /></Table.Td>
              <Table.Td>{new Date(review.created_at).toLocaleString('pt-BR')}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {selectedId && <ReviewDetailPanel reviewId={selectedId} />}
    </>
  );
}
