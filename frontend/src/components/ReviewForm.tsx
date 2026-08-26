import { Button, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview, type CreateReviewInput } from '../api/reviews';

function generateExternalId() {
  return `review-${crypto.randomUUID()}`;
}

export function ReviewForm() {
  const queryClient = useQueryClient();
  const form = useForm({
    initialValues: {
      external_id: generateExternalId(),
      company_id: '',
      rating: 3,
      comment: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateReviewInput) => createReview(values),
    onSuccess: () => {
      notifications.show({ message: 'Avaliação enviada para processamento', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      form.setValues({ external_id: generateExternalId(), company_id: '', rating: 3, comment: '' });
    },
    onError: (error: Error) => {
      notifications.show({ message: error.message, color: 'red' });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack>
        <TextInput label="ID do pedido" {...form.getInputProps('external_id')} />
        <TextInput label="Empresa" required withAsterisk={false} {...form.getInputProps('company_id')} />
        <NumberInput label="Nota" min={1} max={5} required withAsterisk={false} {...form.getInputProps('rating')} />
        <Textarea label="Comentário" required withAsterisk={false} minRows={3} {...form.getInputProps('comment')} />
        <Button type="submit" loading={mutation.isPending}>
          Enviar avaliação
        </Button>
      </Stack>
    </form>
  );
}
