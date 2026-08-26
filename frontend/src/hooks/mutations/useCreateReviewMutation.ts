import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createReview } from '../../api';
import type { CoreCreateReviewInput } from '../../types';

export function useCreateReviewMutation(onCreated?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CoreCreateReviewInput) => createReview(values),
    onSuccess: () => {
      notifications.show({ message: 'Avaliação enviada para processamento', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      onCreated?.();
    },
    onError: (error: Error) => {
      notifications.show({ message: error.message, color: 'red' });
    },
  });
}
