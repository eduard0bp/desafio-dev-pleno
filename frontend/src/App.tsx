import { AppShell, Container, Stack } from '@mantine/core';
import { Sidebar } from './components/Sidebar';
import { ReviewForm } from './components/ReviewForm';
import { ReviewList } from './components/ReviewList';

export default function App() {
  return (
    <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="lg">
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="lg">
          <Stack gap="xl">
            <ReviewForm />
            <ReviewList />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
