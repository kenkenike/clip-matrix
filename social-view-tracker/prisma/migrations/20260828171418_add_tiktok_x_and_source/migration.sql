-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('OFFICIAL', 'WEB');

-- AlterEnum
ALTER TYPE "ContentKind" ADD VALUE 'TWEET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'TIKTOK';
ALTER TYPE "Platform" ADD VALUE 'X';

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "source" "DataSource";

-- AlterTable
ALTER TABLE "MetricSnapshot" ADD COLUMN     "source" "DataSource";

-- CreateIndex
CREATE INDEX "Content_userId_accountName_idx" ON "Content"("userId", "accountName");
