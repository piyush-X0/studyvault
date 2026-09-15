DROP INDEX IF EXISTS "DocumentChunks_embedding_idx"; 
ALTER TABLE "DocumentChunks" ALTER COLUMN embedding TYPE vector(384);
CREATE INDEX "DocumentChunks_embedding_idx" ON "DocumentChunks" USING hnsw (embedding vector_cosine_ops);