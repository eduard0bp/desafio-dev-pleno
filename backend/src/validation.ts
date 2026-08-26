import { z } from 'zod';

export const createReviewSchema = z.object({
  external_id: z.string().trim().min(1).max(100),
  company_id: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;
