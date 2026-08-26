import { Prisma, type Review } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateReviewInput {
  externalId: string;
  companyId: string;
  rating: number;
  comment: string;
}

export interface CreateReviewResult {
  review: Review;
  created: boolean;
}

export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  try {
    const review = await prisma.review.create({ data: input });
    return { review, created: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.review.findUniqueOrThrow({
        where: { externalId: input.externalId },
      });
      return { review: existing, created: false };
    }
    throw err;
  }
}

export async function listReviews(): Promise<Review[]> {
  return prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getReviewById(id: string): Promise<Review | null> {
  return prisma.review.findUnique({ where: { id } });
}
