-- AlterTable
ALTER TABLE "celebrities" ADD COLUMN "nickname" VARCHAR(255),
ADD COLUMN "nationality" VARCHAR(10);

-- CreateIndex
CREATE INDEX "celebrities_nationality_idx" ON "celebrities"("nationality");
