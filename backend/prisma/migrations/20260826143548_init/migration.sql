-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "analysis" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_external_id_key" ON "reviews"("external_id");
