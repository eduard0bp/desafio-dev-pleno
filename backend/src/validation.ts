import { z } from 'zod';

export const createReviewSchema = z.object({
  external_id: z.string().min(1),
  company_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;
