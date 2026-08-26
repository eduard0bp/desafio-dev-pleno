import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Navigate, Route, Routes } from 'react-router';
import { Sidebar } from './components';
import { AvaliacoesPage, NovaAvaliacaoPage } from './pages';

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Abrir menu" />
          <Title order={4} c="primary.7">
            Falaê!
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/avaliacoes" replace />} />
          <Route path="/avaliar" element={<NovaAvaliacaoPage />} />
          <Route path="/admin/avaliacoes" element={<AvaliacoesPage />} />
          <Route path="*" element={<Navigate to="/admin/avaliacoes" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
