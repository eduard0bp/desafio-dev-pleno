import { Alert, Badge, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getReview, type ReviewDetail } from '../api/reviews';

const ACTIVE_STATUSES = new Set<ReviewDetail['status']>(['pending', 'processing']);

export function getDetailRefetchInterval(review: ReviewDetail | undefined): number | false {
  if (!review) return false;
  return ACTIVE_STATUSES.has(review.status) ? 3000 : false;
}

export function ReviewDetailPanel({ reviewId }: { reviewId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => getReview(reviewId),
    refetchInterval: (query) => getDetailRefetchInterval(query.state.data),
  });

  if (isLoading) return <Loader size="sm" />;
  if (isError) return <Alert color="red">{(error as Error).message}</Alert>;
  if (!data) return <Alert color="red">Não foi possível carregar o detalhe.</Alert>;

  return (
    <Paper withBorder p="md">
      <Stack gap="xs">
        <Text fw={600}>{data.comment}</Text>
        {data.analysis && (
          <Group gap="xs">
            <Badge>{data.analysis.sentiment}</Badge>
            <Badge color="grape">{data.analysis.category}</Badge>
            <Text size="sm" c="dimmed">confiança: {Math.round(data.analysis.confidence * 100)}%</Text>
          </Group>
        )}
        {data.status === 'failed' && (
          <Alert color="red">
            {data.last_error?.message ?? 'Falha ao processar esta avaliação após todas as tentativas.'}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
