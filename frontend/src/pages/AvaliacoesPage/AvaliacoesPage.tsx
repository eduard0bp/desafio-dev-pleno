import { Affix, Container } from '@mantine/core';
import { NotificationBell, ReviewList } from '../../components';

export function AvaliacoesPage() {
  return (
    <Container size="lg" px={0}>
      <Affix position={{ top: 16, right: 16 }} zIndex={300}>
        <NotificationBell />
      </Affix>
      <ReviewList />
    </Container>
  );
}
