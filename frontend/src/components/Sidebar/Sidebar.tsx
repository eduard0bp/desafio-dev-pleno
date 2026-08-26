import { NavLink, Stack, Text, Title } from '@mantine/core';

export function Sidebar() {
  return (
    <Stack h="100%" justify="space-between" p="md">
      <Stack gap="lg">
        <Title order={3} c="primary.7">
          Falaê!
        </Title>
        <Stack gap={4}>
          <NavLink label="Avaliações" active variant="filled" color="primary" />
        </Stack>
      </Stack>
      <Text size="xs" c="dimmed">
        Monitoramento de feedbacks
      </Text>
    </Stack>
  );
}
