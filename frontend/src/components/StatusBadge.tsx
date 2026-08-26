import { Badge } from '@mantine/core';
import type { ReviewStatus } from '../api/reviews';

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'gray' },
  processing: { label: 'Processando', color: 'blue' },
  completed: { label: 'Concluído', color: 'green' },
  failed: { label: 'Falhou', color: 'red' },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge color={config.color}>{config.label}</Badge>;
}
