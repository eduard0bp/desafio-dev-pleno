import { Select, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { CoreReviewSentiment } from '../../types';
import { toDateOrNull } from '../ReviewList/utils/dates';
import type { FieldFilterHandlers, FieldFilterValues } from '../ReviewList/hooks/useDraftFilters';

const RATING_OPTIONS = [
  { value: '5', label: '5 estrelas' },
  { value: '4', label: '4+ estrelas' },
  { value: '3', label: '3+ estrelas' },
  { value: '2', label: '2+ estrelas' },
  { value: '1', label: '1+ estrela' },
];

const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positivo' },
  { value: 'neutral', label: 'Neutro' },
  { value: 'negative', label: 'Negativo' },
];

export function FilterFields({ value, onChange }: { value: FieldFilterValues; onChange: FieldFilterHandlers }) {
  return (
    <>
      <TextInput
        placeholder="Buscar por empresa..."
        value={value.search}
        onChange={(event) => onChange.setSearch(event.currentTarget.value)}
        w={{ base: '100%', xs: 240 }}
      />
      <Select
        placeholder="Todas as notas"
        data={RATING_OPTIONS}
        value={value.minRating != null ? String(value.minRating) : null}
        onChange={(v) => onChange.setMinRating(v ? Number(v) : null)}
        w={{ base: '100%', xs: 180 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data inicial"
        valueFormat="DD/MM/YYYY"
        value={value.dateFrom}
        onChange={(v) => onChange.setDateFrom(toDateOrNull(v))}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
      <DatePickerInput
        placeholder="Data final"
        valueFormat="DD/MM/YYYY"
        value={value.dateTo}
        onChange={(v) => onChange.setDateTo(toDateOrNull(v))}
        w={{ base: '100%', xs: 150 }}
        clearable
      />
      <Select
        placeholder="Todos os sentimentos"
        data={SENTIMENT_OPTIONS}
        value={value.sentiment}
        onChange={(v) => onChange.setSentiment(v as CoreReviewSentiment | null)}
        w={{ base: '100%', xs: 180 }}
        clearable
      />
    </>
  );
}
