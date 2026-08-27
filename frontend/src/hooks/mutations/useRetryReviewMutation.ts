import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { retryReview } from '../../api';

/**
 * Takes the review id as a mutate() argument rather than a hook argument, so
 * a single instance can be shared across many rows (e.g. the review list)
 * without calling a hook inside a loop. Per-row pending state can be read
 * via `retryMutation.isPending && retryMutation.variables === review.id`.
 */
export function useRetryReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => retryReview(reviewId),
    onSuccess: (_data, reviewId) => {
      notifications.show({ message: 'Avaliação enviada para reprocessamento', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
    },
    onError: (error: Error) => {
      notifications.show({ message: error.message, color: 'red' });
    },
  });
}
