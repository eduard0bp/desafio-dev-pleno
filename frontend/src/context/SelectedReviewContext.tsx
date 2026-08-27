import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SelectedReviewContextValue {
  selectedId: string | null;
  openReview: (id: string) => void;
  closeReview: () => void;
}

const SelectedReviewContext = createContext<SelectedReviewContextValue | null>(null);

export function SelectedReviewProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const value = useMemo<SelectedReviewContextValue>(
    () => ({ selectedId, openReview: setSelectedId, closeReview: () => setSelectedId(null) }),
    [selectedId]
  );

  return <SelectedReviewContext.Provider value={value}>{children}</SelectedReviewContext.Provider>;
}

export function useSelectedReview(): SelectedReviewContextValue {
  const context = useContext(SelectedReviewContext);
  if (!context) throw new Error('useSelectedReview must be used within a SelectedReviewProvider');
  return context;
}
