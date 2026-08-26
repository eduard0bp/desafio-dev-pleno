import { Alert, Badge, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getReview } from '../api/reviews';

export function ReviewDetailPanel({ reviewId }: { reviewId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => getReview(reviewId),
    retry: false,
  });

  if (isLoading) return <Loader size="sm" />;
  if (isError || !data) return <Alert color="red">Não foi possível carregar o detalhe.</Alert>;

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
        {data.status === 'failed' && <Alert color="red">Falha ao processar esta avaliação após todas as tentativas.</Alert>}
      </Stack>
    </Paper>
  );
}
