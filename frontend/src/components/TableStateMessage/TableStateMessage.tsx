import type { ReactNode } from 'react';
import { Stack, Text, ThemeIcon } from '@mantine/core';

interface TableStateMessageProps {
  icon: ReactNode;
  title: string;
  description?: string;
  color?: string;
}

export function TableStateMessage({ icon, title, description, color = 'gray' }: TableStateMessageProps) {
  return (
    <Stack align="center" gap={4} py="xl">
      <ThemeIcon variant="light" color={color} size={48} radius="xl">
        {icon}
      </ThemeIcon>
      <Text fw={600}>{title}</Text>
      {description && (
        <Text size="sm" c="dimmed" ta="center" maw={360}>
          {description}
        </Text>
      )}
    </Stack>
  );
}
