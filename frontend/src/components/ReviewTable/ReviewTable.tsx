import { Box, Paper, Text } from '@mantine/core';
import { IconAlertTriangle, IconFilterOff, IconInbox } from '@tabler/icons-react';
import { TableStateMessage } from '../TableStateMessage/TableStateMessage';
import type { CoreReviewListItem } from '../../types';
import type { useRetryReviewMutation } from '../../hooks';
import { ReviewTableRow } from './ReviewTableRow';
import {
  COLUMN_LABELS,
  GRID_TEMPLATE_COLUMNS,
  STICKY_ACTIONS_HEADER_STYLE,
  TABLE_MIN_WIDTH,
} from './reviewTableStyles';

export function ReviewTable({
  reviews,
  isError,
  error,
  hasActiveFilters,
  emptyStateMessage,
  retryMutation,
  onOpenReview,
}: {
  reviews: CoreReviewListItem[];
  isError: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  emptyStateMessage: string;
  retryMutation: ReturnType<typeof useRetryReviewMutation>;
  onOpenReview: (reviewId: string) => void;
}) {
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Box
        role="table"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--mantine-spacing-xs)',
          minWidth: TABLE_MIN_WIDTH,
        }}
      >
        <Box role="rowgroup">
          <Box
            role="row"
            px="md"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
              gap: 'var(--mantine-spacing-sm)',
            }}
          >
            {COLUMN_LABELS.map((label) => (
              <Text
                key={label}
                role="columnheader"
                size="sm"
                fw={600}
                c="dimmed"
                ta="left"
                style={label === 'Ações' ? STICKY_ACTIONS_HEADER_STYLE : undefined}
              >
                {label}
              </Text>
            ))}
          </Box>
        </Box>

        <Box
          role="rowgroup"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--mantine-spacing-xs)',
          }}
        >
          {isError ? (
            <Paper withBorder radius="md" p="md">
              <TableStateMessage
                icon={<IconAlertTriangle size={24} />}
                color="red"
                title={(error as Error).message}
                description="Tente novamente em instantes."
              />
            </Paper>
          ) : reviews.length === 0 ? (
            <Paper withBorder radius="md" p="md">
              <TableStateMessage
                icon={hasActiveFilters ? <IconFilterOff size={24} /> : <IconInbox size={24} />}
                title={emptyStateMessage}
                description={
                  hasActiveFilters
                    ? 'Tente ajustar ou limpar os filtros aplicados.'
                    : 'Assim que uma avaliação for cadastrada, ela aparece aqui.'
                }
              />
            </Paper>
          ) : (
            reviews.map((review) => (
              <ReviewTableRow
                key={review.id}
                review={review}
                retryMutation={retryMutation}
                onOpenReview={onOpenReview}
              />
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}
