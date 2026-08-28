import { Container } from '@mantine/core';
import { ReviewForm } from '../../components';

export function NewReviewPage() {
  return (
    <Container size="sm" px={0}>
      <ReviewForm />
    </Container>
  );
}
