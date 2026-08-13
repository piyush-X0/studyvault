-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'PROCESSING', 'Embedded', 'FAILED');

-- DropIndex
DROP INDEX "Document_extractedStatus_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "embeddingError" TEXT,
ADD COLUMN     "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "docChunks" ADD COLUMN     "embedding" vector(1536);

-- CreateIndex
CREATE INDEX "Document_extractedStatus_embeddingStatus_idx" ON "Document"("extractedStatus", "embeddingStatus");
