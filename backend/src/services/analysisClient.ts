import { shouldRetry, type AnalyzeErrorBody } from '../lib/retry';

const REQUEST_TIMEOUT_MS = 6000;

export interface AnalyzeSuccess {
  request_id: string;
  review_id: string;
  analysis: {
    sentiment: string;
    category: string;
    confidence: number;
    matched_keywords: string[];
  };
  processing_time_ms: number;
  processed_at: string;
}

export class RetryableAnalysisError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'RetryableAnalysisError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class NonRetryableAnalysisError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'NonRetryableAnalysisError';
    this.code = code;
  }
}

export interface AnalyzeReviewInput {
  reviewId: string;
  companyId: string;
  rating: number;
  text: string;
  mockScenario?: string;
}

export async function analyzeReview(input: AnalyzeReviewInput): Promise<AnalyzeSuccess> {
  const baseUrl = process.env.MOCK_ANALYSIS_API_URL ?? 'http://localhost:4000';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (input.mockScenario) headers['x-mock-scenario'] = input.mockScenario;

    const response = await fetch(`${baseUrl}/v1/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        review_id: input.reviewId,
        company_id: input.companyId,
        rating: input.rating,
        text: input.text,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      return (await response.json()) as AnalyzeSuccess;
    }

    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    const body = (await response.json().catch(() => undefined)) as AnalyzeErrorBody | undefined;

    if (shouldRetry(response.status, body)) {
      throw new RetryableAnalysisError(body?.error?.message ?? `HTTP ${response.status}`, retryAfterSeconds);
    }

    throw new NonRetryableAnalysisError(body?.error?.message ?? `HTTP ${response.status}`, body?.error?.code ?? 'UNKNOWN');
  } catch (err) {
    if (err instanceof RetryableAnalysisError || err instanceof NonRetryableAnalysisError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new RetryableAnalysisError('timeout while calling the analysis API');
    }
    throw new RetryableAnalysisError(err instanceof Error ? err.message : 'unknown network error');
  } finally {
    clearTimeout(timeout);
  }
}
