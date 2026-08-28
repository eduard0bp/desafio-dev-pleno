import { Badge, Box, Paper, Rating, Text } from '@mantine/core';
import { SENTIMENT_LABELS, CATEGORY_LABELS } from '../../constants';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import type { CoreReviewListItem } from '../../types';
import type { useRetryReviewMutation } from '../../hooks';
import classes from './ReviewTable.module.css';
import { CELL_FLEX_STYLE, GRID_TEMPLATE_COLUMNS, STICKY_ACTIONS_ROW_STYLE } from './reviewTableStyles';
import { ReviewRowActions } from './ReviewRowActions';

export function ReviewTableRow({
  review,
  retryMutation,
  onOpenReview,
}: {
  review: CoreReviewListItem;
  retryMutation: ReturnType<typeof useRetryReviewMutation>;
  onOpenReview: (reviewId: string) => void;
}) {
  const sentiment = review.analysis ? SENTIMENT_LABELS[review.analysis.sentiment] : undefined;
  const category = review.analysis
    ? (CATEGORY_LABELS[review.analysis.category] ?? review.analysis.category)
    : undefined;

  return (
    <Paper
      role="row"
      withBorder
      radius="md"
      p="sm"
      className={classes.row}
      onClick={() => onOpenReview(review.id)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
        gap: 'var(--mantine-spacing-sm)',
        alignItems: 'center',
      }}
    >
      <Box role="cell" miw={0}>
        <Text size="sm" fw={500} truncate="end">
          {review.company_id}
        </Text>
        <Text size="xs" c="dimmed" truncate="end">
          {review.comment}
        </Text>
      </Box>
      <Box role="cell" style={CELL_FLEX_STYLE}>
        <Rating value={review.rating} color="tertiary" size="sm" readOnly />
      </Box>
      <Box role="cell" style={CELL_FLEX_STYLE}>
        <StatusBadge status={review.status} />
      </Box>
      <Box role="cell" style={CELL_FLEX_STYLE}>
        {sentiment ? (
          <Badge color={sentiment.color}>{sentiment.label}</Badge>
        ) : (
          <Text c="dimmed" size="sm">
            —
          </Text>
        )}
      </Box>
      <Box role="cell" style={CELL_FLEX_STYLE}>
        {category ? (
          <Text size="sm">{category}</Text>
        ) : (
          <Text c="dimmed" size="sm">
            —
          </Text>
        )}
      </Box>
      <Text role="cell" size="sm" c="dimmed" miw={0}>
        {new Date(review.created_at).toLocaleDateString('pt-BR')}
      </Text>
      <Box role="cell" style={STICKY_ACTIONS_ROW_STYLE}>
        <ReviewRowActions review={review} retryMutation={retryMutation} onOpenReview={onOpenReview} />
      </Box>
    </Paper>
  );
}
