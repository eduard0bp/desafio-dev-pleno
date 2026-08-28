import { Button, Card, Input, Rating, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreateReviewMutation } from '../../hooks';
import type { CoreCreateReviewInput } from '../../types';

const COMMENT_MAX_LENGTH = 2000;
const SHORT_TEXT_MAX_LENGTH = 100;

function generateExternalId() {
  return `review-${crypto.randomUUID()}`;
}

function emptyFormValues(): CoreCreateReviewInput {
  return {
    external_id: generateExternalId(),
    company_id: '',
    rating: 3,
    comment: '',
  };
}

export function ReviewForm() {
  const form = useForm({
    initialValues: emptyFormValues(),
    validate: {
      company_id: (value) => {
        if (value.trim().length === 0) return 'Informe a empresa';
        if (value.length > SHORT_TEXT_MAX_LENGTH)
          return `O nome da empresa deve ter no máximo ${SHORT_TEXT_MAX_LENGTH} caracteres`;
        return null;
      },
      comment: (value) => {
        if (value.trim().length < 3) return 'O comentário deve ter pelo menos 3 caracteres';
        if (value.length > COMMENT_MAX_LENGTH)
          return `O comentário deve ter no máximo ${COMMENT_MAX_LENGTH} caracteres`;
        return null;
      },
    },
  });

  const mutation = useCreateReviewMutation(() => form.setValues(emptyFormValues()));

  return (
    <Card withBorder p="lg">
      <Stack gap={4} mb="md">
        <Title order={3}>Nova avaliação</Title>
        <Text size="sm" c="dimmed">
          Compartilhe um feedback objetivo sobre a empresa parceira.
        </Text>
      </Stack>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <TextInput label="ID do pedido" maxLength={SHORT_TEXT_MAX_LENGTH} {...form.getInputProps('external_id')} />
          <TextInput
            label="Empresa"
            placeholder="Ex: Acme Corp Industries"
            maxLength={SHORT_TEXT_MAX_LENGTH}
            {...form.getInputProps('company_id')}
          />
          <Input.Wrapper label="Nota">
            <div>
              <Rating
                color="tertiary"
                value={form.values.rating}
                onChange={(value) => form.setFieldValue('rating', value)}
              />
            </div>
          </Input.Wrapper>
          <Textarea
            label="Comentário"
            placeholder="Detalhe os pontos fortes e áreas de melhoria..."
            minRows={3}
            maxLength={COMMENT_MAX_LENGTH}
            description={
              <Text component="span" size="xs" c={form.values.comment.length >= COMMENT_MAX_LENGTH ? 'red' : 'dimmed'}>
                {form.values.comment.length}/{COMMENT_MAX_LENGTH} caracteres
              </Text>
            }
            {...form.getInputProps('comment')}
          />
          <Button type="submit" loading={mutation.isPending}>
            Enviar avaliação
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
