import { ActionIcon, Badge, Divider, Group, Indicator, Popover, ScrollArea, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell } from '@tabler/icons-react';
import { useNegativeReviewsQuery } from '../../hooks';
import classes from './NotificationBell.module.css';

export function NotificationBell() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { data } = useNegativeReviewsQuery();
  const count = data?.pagination.total ?? 0;
  const reviews = data?.data ?? [];

  return (
    <Popover opened={opened} onClose={close} width={320} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Indicator label={count > 9 ? '9+' : count} color="red" size={16} offset={4} disabled={count === 0}>
          <ActionIcon variant="subtle" color="white" aria-label="Avaliações negativas" onClick={toggle}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Stack gap={0}>
          <Text size="sm" fw={600} p="sm">
            Avaliações negativas recentes
          </Text>
          <Divider />
          {reviews.length === 0 ? (
            <Text size="sm" c="dimmed" p="sm">
              Nenhuma avaliação negativa por enquanto.
            </Text>
          ) : (
            <ScrollArea.Autosize mah={280}>
              <Stack gap={0}>
                {reviews.map((review) => (
                  <Stack key={review.id} gap={2} p="sm" className={classes.item}>
                    <Group justify="space-between" gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} truncate="end">
                        {review.company_id}
                      </Text>
                      <Badge color="red" size="xs">
                        Negativo
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" truncate="end">
                      {review.comment}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
