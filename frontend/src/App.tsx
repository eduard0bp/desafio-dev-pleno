import { Container, Divider, Stack, Title } from '@mantine/core';
import { ReviewForm } from './components/ReviewForm';
import { ReviewList } from './components/ReviewList';

export default function App() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Falaê! Avaliações</Title>
        <ReviewForm />
        <Divider label="Avaliações cadastradas" />
        <ReviewList />
      </Stack>
    </Container>
  );
}
