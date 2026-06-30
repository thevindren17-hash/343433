# Mister Mobile — RAG Pipeline (Free Demo Stack)

Python RAG pipeline on the existing Phase 1 Supabase project.
Uses fully free tools — no OpenAI or Anthropic API costs.

## Stack

| Layer | Tool | Cost |
|---|---|---|
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | Free — runs locally |
| Generation | Groq `llama-3.3-70b-versatile` | Free tier (14,400 req/day) |
| Vector DB | Supabase pgvector | Existing Phase 1 project |
| API | FastAPI + uvicorn | Free |

**Critical dimension difference**: sentence-transformers uses 384-dim vectors, NOT 1536.
The `document_chunks.embedding` column and `match_chunks()` RPC must use `vector(384)`.

## Directory Structure

```
mister-mobile-rag/
├── CLAUDE.md
├── .env
├── .gitignore
├── requirements_free.txt
├── data/
│   └── rag_chunks.json          ← 210 text chunks (input to pipeline)
├── sql/
│   ├── schema_free.sql          ← vector(384) schema + match_chunks() RPC
│   └── seed_ALL_combined.sql    ← mock data seed (devices, quotes, etc.)
├── scripts/
│   └── rag_pipeline_free.py     ← MAIN: embed locally → upsert Supabase
└── api/
    └── main_free.py             ← FastAPI: /api/quote using Groq
```

## Commands

```bash
source .venv/bin/activate

# Install dependencies (sentence-transformers downloads ~90MB model on first run)
pip install -r requirements_free.txt

# Run the pipeline: embeds 210 chunks locally, upserts to Supabase
python3 scripts/rag_pipeline_free.py

# Start the API
uvicorn api.main_free:app --reload --port 8000

# Test
curl -X POST http://localhost:8000/api/quote \
  -H "Content-Type: application/json" \
  -d '{"query": "iPhone 15 Pro Max screen cost?", "brand_hint": "Apple", "service_tier": "express"}'
```

## Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
GROQ_API_KEY=gsk_...
```

Get Groq key free at: console.groq.com (no credit card, instant signup)
Get Supabase keys: Project Settings → API → service_role key

## Supabase Setup (same project as Phase 1)

Run in this order in Supabase SQL Editor:

1. `CREATE EXTENSION IF NOT EXISTS vector;`
2. Paste + run `sql/schema_free.sql`
   - Creates `document_chunks` with `vector(384)` column
   - Creates `match_chunks()` RPC with 384-dim signature
   - **If migrating from 1536-dim**: uncomment the MIGRATION block at bottom of schema_free.sql first
3. Paste + run `sql/seed_ALL_combined.sql` (mock data for devices, quotes, etc.)
4. Run `python3 scripts/rag_pipeline_free.py` to generate + store embeddings

Verify in Supabase SQL Editor:
```sql
SELECT chunk_id, chunk_type, array_length(embedding::float[], 1) AS dims
FROM document_chunks WHERE embedding IS NOT NULL LIMIT 3;
-- Must show dims = 384
```

## Key Differences from Paid Version

- Vector dims: **384** (not 1536) — update everywhere if changing model
- Retrieval threshold: **0.60** (not 0.72) — 384-dim space is less separable
- Embedding is **synchronous** on CPU — ~5s for 210 chunks total (not rate-limited)
- Model downloads to `~/.cache/huggingface/` on first run, cached after
- Groq rate limit: 30 req/min — pipeline adds `time.sleep(1)` between demo queries

## Common Errors

| Error | Fix |
|---|---|
| `could not find function match_chunks(vector(384))` | Schema has wrong dims — re-run schema_free.sql |
| `No module named 'sentence_transformers'` | `pip install sentence-transformers` |
| `AuthenticationError: groq` | Set GROQ_API_KEY in .env — get free at console.groq.com |
| `No chunks above threshold` | Lower threshold to 0.45 in the request body |
| First run is slow | Normal — model downloading to cache (~90MB, one time only) |

## Do NOT

- Do not use `vector(1536)` in the schema — it must match 384 for this model
- Do not run the paid `rag_pipeline.py` (OpenAI) after seeding with this pipeline — dimensions will conflict
- Do not commit `.env`
