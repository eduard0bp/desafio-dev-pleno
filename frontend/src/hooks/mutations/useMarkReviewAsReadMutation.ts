import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markReviewAsRead } from '../../api';

export function useMarkReviewAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => markReviewAsRead(reviewId),
    onSuccess: (_data, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
    },
  });
}
