import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { retryReview } from '../../api';

export function useRetryReviewMutation(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryReview(reviewId),
    onSuccess: () => {
      notifications.show({ message: 'Avaliação enviada para reprocessamento', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
    },
    onError: (error: Error) => {
      notifications.show({ message: error.message, color: 'red' });
    },
  });
}
