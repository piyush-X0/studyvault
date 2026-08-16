/*
  Warnings:

  - Added the required column `userId` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentChunks_embedding_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
