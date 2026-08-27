import { z } from 'zod';

export const createReviewSchema = z.object({
  external_id: z
    .string('external_id é obrigatório')
    .trim()
    .min(1, 'external_id é obrigatório')
    .max(100, 'external_id deve ter no máximo 100 caracteres'),
  company_id: z
    .string('Informe a empresa')
    .trim()
    .min(1, 'Informe a empresa')
    .max(100, 'O nome da empresa deve ter no máximo 100 caracteres'),
  rating: z
    .number('A nota deve ser um número')
    .int('A nota deve ser um número inteiro')
    .min(1, 'A nota deve estar entre 1 e 5')
    .max(5, 'A nota deve estar entre 1 e 5'),
  comment: z
    .string('Informe o comentário')
    .trim()
    .min(3, 'O comentário deve ter pelo menos 3 caracteres')
    .max(2000, 'O comentário deve ter no máximo 2000 caracteres'),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number('A página deve ser um número').int().min(1, 'A página deve ser maior que zero').default(1),
  pageSize: z.coerce
    .number('O tamanho de página deve ser um número')
    .int()
    .min(1, 'O tamanho de página deve estar entre 1 e 100')
    .max(100, 'O tamanho de página deve estar entre 1 e 100')
    .default(10),
  status: z.enum(['pending', 'processing', 'completed', 'failed'], 'Status inválido').optional(),
  minRating: z.coerce
    .number('A nota mínima deve ser um número')
    .int()
    .min(1, 'A nota mínima deve estar entre 1 e 5')
    .max(5, 'A nota mínima deve estar entre 1 e 5')
    .optional(),
  search: z.string().trim().min(1, 'A busca não pode ser vazia').optional(),
  dateFrom: z.coerce.date('Data inicial inválida').optional(),
  dateTo: z.coerce.date('Data final inválida').optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative'], 'Sentimento inválido').optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
