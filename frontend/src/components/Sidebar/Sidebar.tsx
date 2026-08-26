import { NavLink, Stack, Text, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';

interface NavSection {
  heading: string;
  items: { to: string; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Área do cliente',
    items: [{ to: '/avaliar', label: 'Enviar Avaliação' }],
  },
  {
    heading: 'Painel interno',
    items: [{ to: '/admin/avaliacoes', label: 'Monitoramento' }],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <Stack h="100%" p="md" gap="lg">
      <Title order={3} c="primary.7">
        Falaê!
      </Title>
      {NAV_SECTIONS.map((section) => (
        <Stack key={section.heading} gap={4}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {section.heading}
          </Text>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              active={location.pathname === item.to}
              variant="filled"
              color="primary"
              onClick={onNavigate}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
