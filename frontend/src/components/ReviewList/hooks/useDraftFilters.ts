import { useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import type { CoreReviewSentiment } from '../../../types'
import type { useReviewFilters } from './useReviewFilters'

export interface FieldFilterValues {
  search: string
  minRating: number | null
  dateFrom: Date | null
  dateTo: Date | null
  sentiment: CoreReviewSentiment | null
}

export interface FieldFilterHandlers {
  setSearch: (value: string) => void
  setMinRating: (value: number | null) => void
  setDateFrom: (value: Date | null) => void
  setDateTo: (value: Date | null) => void
  setSentiment: (value: CoreReviewSentiment | null) => void
}

const EMPTY_FIELD_FILTERS: FieldFilterValues = {
  search: '',
  minRating: null,
  dateFrom: null,
  dateTo: null,
  sentiment: null
}

function fieldFiltersFrom(filters: ReturnType<typeof useReviewFilters>): FieldFilterValues {
  return {
    search: filters.search,
    minRating: filters.minRating,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sentiment: filters.sentiment
  }
}

export function useDraftFilters(filters: ReturnType<typeof useReviewFilters>) {
  const [opened, { open: openDisclosure, close }] = useDisclosure(false)
  const [draft, setDraft] = useState<FieldFilterValues>(() => fieldFiltersFrom(filters))

  function open() {
    setDraft(fieldFiltersFrom(filters))
    openDisclosure()
  }

  function apply() {
    filters.setSearch(draft.search)
    filters.setMinRating(draft.minRating)
    filters.setDateFrom(draft.dateFrom)
    filters.setDateTo(draft.dateTo)
    filters.setSentiment(draft.sentiment)
    close()
  }

  function clear() {
    setDraft(EMPTY_FIELD_FILTERS)
    filters.clearFieldFilters()
  }

  const handlers: FieldFilterHandlers = {
    setSearch: value => setDraft(current => ({ ...current, search: value })),
    setMinRating: value => setDraft(current => ({ ...current, minRating: value })),
    setDateFrom: value => setDraft(current => ({ ...current, dateFrom: value })),
    setDateTo: value => setDraft(current => ({ ...current, dateTo: value })),
    setSentiment: value => setDraft(current => ({ ...current, sentiment: value }))
  }

  return { opened, draft, handlers, open, close, apply, clear }
}
