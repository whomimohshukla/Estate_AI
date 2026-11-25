-- DropIndex
DROP INDEX "PropertyEmbedding_embedding_hnsw_idx";

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
