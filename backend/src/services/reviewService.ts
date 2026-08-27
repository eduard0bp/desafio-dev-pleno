import { Prisma, type Review, type ReviewStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { CorePagination, CoreReviewStatusCounts } from '../types';

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

export interface ListReviewsFilters {
  page: number;
  pageSize: number;
  status?: ReviewStatus;
  minRating?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ListReviewsResult {
  data: Review[];
  pagination: CorePagination;
  counts: CoreReviewStatusCounts;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function buildBaseWhere(filters: ListReviewsFilters): Prisma.ReviewWhereInput {
  return {
    ...(filters.minRating != null ? { rating: { gte: filters.minRating } } : {}),
    ...(filters.search ? { companyId: { contains: filters.search, mode: 'insensitive' as const } } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: endOfDay(filters.dateTo) } : {}),
          },
        }
      : {}),
    // analysis only exists once a review completes, so filtering by
    // sentiment naturally excludes pending/processing/failed reviews.
    ...(filters.sentiment ? { analysis: { path: ['sentiment'], equals: filters.sentiment } } : {}),
  };
}

const EMPTY_COUNTS: CoreReviewStatusCounts = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

export async function listReviews(filters: ListReviewsFilters): Promise<ListReviewsResult> {
  const baseWhere = buildBaseWhere(filters);
  const where: Prisma.ReviewWhereInput = {
    ...baseWhere,
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [data, total, grouped] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
  ]);

  const counts: CoreReviewStatusCounts = { ...EMPTY_COUNTS };
  for (const group of grouped) {
    counts[group.status] = group._count._all;
    counts.all += group._count._all;
  }

  return {
    data,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
    counts,
  };
}

export async function getReviewById(id: string): Promise<Review | null> {
  return prisma.review.findUnique({ where: { id } });
}

/** Resets a review so it can be reprocessed from scratch. Caller must have
 * already confirmed the review exists and is currently `failed`. */
export async function retryReview(id: string): Promise<Review> {
  return prisma.review.update({
    where: { id },
    data: { status: 'pending', lastError: Prisma.JsonNull, attempts: 0, processedAt: null },
  });
}
