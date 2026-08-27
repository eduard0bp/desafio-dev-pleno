import { Button, Chip, Drawer, Group, Stack } from '@mantine/core'
import { IconFilter } from '@tabler/icons-react'
import type { CoreReviewStatusCounts } from '../../types'
import type { StatusFilterValue, useReviewFilters } from '../ReviewList/hooks/useReviewFilters'
import type { useDraftFilters } from '../ReviewList/hooks/useDraftFilters'
import { FilterFields } from './FilterFields'

const STATUS_CHIPS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'failed', label: 'Falhas' }
]

export function ReviewFilters({
  filters,
  draft,
  counts
}: {
  filters: ReturnType<typeof useReviewFilters>
  draft: ReturnType<typeof useDraftFilters>
  counts: CoreReviewStatusCounts
}) {
  const activeFieldFilterCount = [
    filters.debouncedSearch !== '',
    filters.minRating != null,
    filters.dateFrom != null,
    filters.dateTo != null,
    filters.sentiment != null
  ].filter(Boolean).length

  return (
    <>
      <Chip.Group
        value={filters.status}
        onChange={value => filters.setStatus(value as StatusFilterValue)}
      >
        <Group gap="xs" wrap="wrap">
          {STATUS_CHIPS.map(chip => (
            <Chip key={chip.value} value={chip.value} variant="filled" color="primary">
              {chip.label} ({counts[chip.value]})
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      <Button
        hiddenFrom="sm"
        color="tertiary"
        leftSection={<IconFilter size={16} />}
        onClick={draft.open}
      >
        Filtros
        {activeFieldFilterCount > 0 ? ` (${activeFieldFilterCount})` : ''}
      </Button>

      <Group gap="sm" wrap="wrap" visibleFrom="sm">
        <FilterFields value={filters} onChange={filters} />
        {activeFieldFilterCount > 0 && (
          <Button variant="default" onClick={filters.clearFieldFilters}>
            Limpar filtros
          </Button>
        )}
      </Group>

      <Drawer
        opened={draft.opened}
        onClose={draft.close}
        position="top"
        title="Filtros"
        hiddenFrom="sm"
        styles={{ content: { height: 'auto' } }}
      >
        <Stack gap="sm">
          <FilterFields value={draft.draft} onChange={draft.handlers} />
          <Group gap="sm" grow>
            <Button variant="default" onClick={draft.clear}>
              Limpar filtros
            </Button>
            <Button color="tertiary" onClick={draft.apply}>
              Aplicar filtros
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </>
  )
}
