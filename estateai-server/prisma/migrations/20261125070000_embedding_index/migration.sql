CREATE INDEX "PropertyEmbedding_embedding_hnsw_idx" ON "PropertyEmbedding" USING hnsw ("embedding" vector_cosine_ops);
