/*
  Warnings:

  - The values [Embedded] on the enum `EmbeddingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `docChunks` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmbeddingStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'EMBEDDED', 'FAILED');
ALTER TABLE "public"."Document" ALTER COLUMN "embeddingStatus" DROP DEFAULT;
ALTER TABLE "Document" ALTER COLUMN "embeddingStatus" TYPE "EmbeddingStatus_new" USING ("embeddingStatus"::text::"EmbeddingStatus_new");
ALTER TYPE "EmbeddingStatus" RENAME TO "EmbeddingStatus_old";
ALTER TYPE "EmbeddingStatus_new" RENAME TO "EmbeddingStatus";
DROP TYPE "public"."EmbeddingStatus_old";
ALTER TABLE "Document" ALTER COLUMN "embeddingStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "docChunks" DROP CONSTRAINT "docChunks_documentId_fkey";

-- DropTable
DROP TABLE "docChunks";

-- CreateTable
CREATE TABLE "DocumentChunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "charCount" INTEGER NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentChunks_documentId_idx" ON "DocumentChunks"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunks_documentId_chunkIndex_key" ON "DocumentChunks"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "DocumentChunks" ADD CONSTRAINT "DocumentChunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
