import { Badge } from '@mantine/core';
import type { CoreReviewStatus } from '../../types';

const STATUS_CONFIG: Record<CoreReviewStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'neutral' },
  processing: { label: 'Processando', color: 'primary' },
  completed: { label: 'Concluído', color: 'green' },
  failed: { label: 'Falhou', color: 'red' },
};

export function StatusBadge({ status }: { status: CoreReviewStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge color={config.color}>{config.label}</Badge>;
}
