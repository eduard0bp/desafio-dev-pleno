import { Alert, Badge, Center, Group, Loader, Rating, ScrollArea, Stack, Text } from '@mantine/core';
import { useReviewQuery } from '../../hooks';
import { SENTIMENT_LABELS, CATEGORY_LABELS } from '../../constants';
import { StatusBadge } from '../StatusBadge/StatusBadge';

export function ReviewDetailPanel({ reviewId }: { reviewId: string }) {
  const { data, isLoading, isError, error } = useReviewQuery(reviewId);

  if (isLoading) {
    return (
      <Center py="lg">
        <Loader size="sm" />
      </Center>
    );
  }
  if (isError) return <Alert color="red">{(error as Error).message}</Alert>;
  if (!data) return <Alert color="red">Não foi possível carregar o detalhe.</Alert>;

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={700}>{data.company_id}</Text>
        <StatusBadge status={data.status} />
      </Group>
      <Rating value={data.rating} color="tertiary" size="sm" readOnly />
      <ScrollArea.Autosize mah={{ base: 150, sm: 220 }} type="auto" offsetScrollbars>
        <Text style={{ whiteSpace: 'pre-wrap' }}>{data.comment}</Text>
      </ScrollArea.Autosize>
      {data.analysis && (
        <Group gap="xs">
          <Badge color={SENTIMENT_LABELS[data.analysis.sentiment]?.color}>
            {SENTIMENT_LABELS[data.analysis.sentiment]?.label ?? data.analysis.sentiment}
          </Badge>
          <Badge color="tertiary">{CATEGORY_LABELS[data.analysis.category] ?? data.analysis.category}</Badge>
          <Text size="sm" c="dimmed">confiança: {Math.round(data.analysis.confidence * 100)}%</Text>
        </Group>
      )}
      {data.status === 'failed' && (
        <Alert color="red">
          {data.last_error?.message ?? 'Falha ao processar esta avaliação após todas as tentativas.'}
        </Alert>
      )}
    </Stack>
  );
}
