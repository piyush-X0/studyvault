-- CreateTable
CREATE TABLE "docChunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "docChunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "docChunks_documentId_idx" ON "docChunks"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "docChunks_documentId_chunkIndex_key" ON "docChunks"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "docChunks" ADD CONSTRAINT "docChunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
