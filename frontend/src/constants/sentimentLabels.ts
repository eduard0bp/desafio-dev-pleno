export interface SentimentLabel {
  label: string;
  color: string;
}

export const SENTIMENT_LABELS: Record<string, SentimentLabel> = {
  positive: { label: 'Positivo', color: 'green' },
  neutral: { label: 'Neutro', color: 'neutral' },
  negative: { label: 'Negativo', color: 'red' },
};
