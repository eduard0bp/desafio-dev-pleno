import type { DateValue } from '@mantine/dates';

export function toDateOrNull(value: DateValue): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
