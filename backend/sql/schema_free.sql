-- ============================================================
-- Mister Mobile RAG Schema — 384-dim (sentence-transformers)
-- Run in Supabase SQL Editor in this order:
--   1. CREATE EXTENSION IF NOT EXISTS vector;
--   2. This file
-- ============================================================

-- MIGRATION BLOCK: uncomment if you previously ran a 1536-dim schema
-- DROP TABLE IF EXISTS document_chunks CASCADE;
-- DROP FUNCTION IF EXISTS match_chunks(vector, float, int);

CREATE TABLE IF NOT EXISTS document_chunks (
    id          BIGSERIAL PRIMARY KEY,
    chunk_id    TEXT        UNIQUE NOT NULL,
    chunk_type  TEXT,
    content     TEXT        NOT NULL,
    metadata    JSONB       DEFAULT '{}',
    embedding   vector(384),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for fast approximate cosine search
-- lists = 50 is reasonable for ~1000 rows; increase for larger datasets
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- match_chunks: cosine similarity search, returns top-k chunks above threshold
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding  vector(384),
    match_threshold  float DEFAULT 0.60,
    match_count      int   DEFAULT 5
)
RETURNS TABLE (
    id          BIGINT,
    chunk_id    TEXT,
    chunk_type  TEXT,
    content     TEXT,
    metadata    JSONB,
    similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        dc.id,
        dc.chunk_id,
        dc.chunk_type,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Verify after running rag_pipeline_free.py:
-- SELECT chunk_id, chunk_type, array_length(embedding::float[], 1) AS dims
-- FROM document_chunks WHERE embedding IS NOT NULL LIMIT 3;
-- Expected: dims = 384
