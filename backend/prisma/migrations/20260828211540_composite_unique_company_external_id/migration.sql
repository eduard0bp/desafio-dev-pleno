-- DropIndex
DROP INDEX "reviews_external_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "reviews_company_id_external_id_key" ON "reviews"("company_id", "external_id");
