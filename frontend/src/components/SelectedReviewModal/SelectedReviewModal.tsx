import { Modal } from '@mantine/core';
import { useSelectedReview } from '../../context/SelectedReviewContext';
import { ReviewDetailPanel } from '../ReviewDetailPanel/ReviewDetailPanel';

export function SelectedReviewModal() {
  const { selectedId, closeReview } = useSelectedReview();

  return (
    <Modal opened={selectedId != null} onClose={closeReview} title="Detalhe da avaliação" centered>
      {selectedId && <ReviewDetailPanel reviewId={selectedId} />}
    </Modal>
  );
}
