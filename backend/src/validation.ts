import { z } from 'zod';

export const createReviewSchema = z.object({
  external_id: z.string().trim().min(1).max(100),
  company_id: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
