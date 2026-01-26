CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "chunk_text_trgm_idx" ON "chunks" USING gin ("text" gin_trgm_ops);