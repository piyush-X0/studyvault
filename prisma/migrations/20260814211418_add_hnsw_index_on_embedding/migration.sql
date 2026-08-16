
CREATE INDEX ON "DocumentChunks"
USING hnsw (embedding vector_cosine_ops);