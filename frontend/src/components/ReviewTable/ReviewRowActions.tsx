import { ActionIcon, Text, Tooltip } from '@mantine/core';
import { IconEye, IconRefresh } from '@tabler/icons-react';
import type { useRetryReviewMutation } from '../../hooks';
import type { CoreReviewListItem } from '../../types';

export function ReviewRowActions({
  review,
  retryMutation,
  onOpenReview,
}: {
  review: CoreReviewListItem;
  retryMutation: ReturnType<typeof useRetryReviewMutation>;
  onOpenReview: (reviewId: string) => void;
}) {
  if (review.status === 'failed') {
    return (
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
    );
  }

  if (review.status === 'completed') {
    return (
      <Tooltip label="Ver detalhes da avaliação">
        <ActionIcon
          variant="default"
          aria-label="Ver detalhes da avaliação"
          onClick={(event) => {
            event.stopPropagation();
            onOpenReview(review.id);
          }}
        >
          <IconEye size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Text c="dimmed" size="sm">
      —
    </Text>
  );
}
