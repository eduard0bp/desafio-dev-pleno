import { Group, Image, NavLink, Stack, Text } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import falaeLogo from '../../assets/falae-logo-full.png';
import { NotificationBell } from '../NotificationBell/NotificationBell';
import classes from './Sidebar.module.css';

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
      <Group visibleFrom="sm" justify="space-between" wrap="nowrap">
        <Image src={falaeLogo} alt="Falaê!" w={170} fit="contain" />
        <NotificationBell />
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
              className={classes.navLink}
              onClick={onNavigate}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
