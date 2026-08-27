import { Group, Image, NavLink, Stack, Text, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import falaeIcon from '../../assets/falae-icon.png';

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
    <Stack h="100%" p="md" gap="lg" c="white">
      <Group gap="xs">
        <Image src={falaeIcon} alt="" w={28} h={28} fit="contain" />
        <Title order={3} c="white">
          Falaê!
        </Title>
      </Group>
      {NAV_SECTIONS.map((section) => (
        <Stack key={section.heading} gap={4}>
          <Text size="xs" fw={700} c="primary.2" tt="uppercase">
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
              style={{ color: 'white' }}
              onClick={onNavigate}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
