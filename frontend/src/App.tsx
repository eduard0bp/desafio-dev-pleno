import { Affix, AppShell, Burger, Group, Image } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Navigate, Route, Routes } from 'react-router';
import { NotificationBell, SelectedReviewModal, Sidebar } from './components';
import { AvaliacoesPage, NovaAvaliacaoPage } from './pages';
import { SelectedReviewProvider } from './context/SelectedReviewContext';
import falaeLogo from './assets/falae-logo-full.png';

function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <>
      <AppShell
        header={{ height: { base: 56, sm: 0 } }}
        navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="lg"
      >
        <AppShell.Header hiddenFrom="sm" bg="primary.8" style={{ border: 'none' }}>
          <Group h="100%" px="md" gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" color="white" aria-label="Abrir menu" />
            <Image src={falaeLogo} alt="Falaê!" w={120} fit="contain" />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar bg="primary.8" style={{ border: 'none' }}>
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

        <SelectedReviewModal />
      </AppShell>

      {/* Rendered outside the AppShell layout (not inside the header or
          sidebar) so it stays pinned to the viewport's top-right corner,
          floating above the app, on every breakpoint. */}
      <Affix position={{ top: 16, right: 16 }} zIndex={300}>
        <NotificationBell />
      </Affix>
    </>
  );
}

export default function App() {
  return (
    <SelectedReviewProvider>
      <AppLayout />
    </SelectedReviewProvider>
  );
}
