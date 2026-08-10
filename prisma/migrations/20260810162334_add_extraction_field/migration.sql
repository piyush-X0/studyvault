-- CreateEnum
CREATE TYPE "ExtractedStatus" AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTED', 'FAILED');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extractedStatus" "ExtractedStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "extractionError" TEXT;

-- CreateIndex
CREATE INDEX "Document_extractedStatus_idx" ON "Document"("extractedStatus");
