import { NavLink, Stack, Text, Title } from '@mantine/core';
import { Link, useLocation } from 'react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Avaliações' },
  { to: '/nova-avaliacao', label: 'Nova Avaliação' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <Stack h="100%" justify="space-between" p="md">
      <Stack gap="lg">
        <Title order={3} c="primary.7">
          Falaê!
        </Title>
        <Stack gap={4}>
          {NAV_ITEMS.map((item) => (
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
      </Stack>
      <Text size="xs" c="dimmed">
        Monitoramento de feedbacks
      </Text>
    </Stack>
  );
}
