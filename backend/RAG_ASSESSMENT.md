# Mister Mobile RAG System — Assessment & Scaling Guide

**Stack:** sentence-transformers (384-dim) · Groq llama-3.3-70b · Supabase pgvector · FastAPI  
**Date:** June 2026  

---

## 1. Current Status — Free Tier

### What Is Complete ✅

| Component | Status | Detail |
|---|---|---|
| Embedding pipeline | ✅ Done | 210 chunks embedded at 384-dim, stored in Supabase |
| Vector search | ✅ Done | Exact cosine scan (no index), threshold 0.40 |
| RAG API | ✅ Done | FastAPI on `localhost:8000`, CORS enabled |
| LLM generation | ✅ Done | Groq `llama-3.3-70b-versatile` free tier |
| Chat UI | ✅ Done | `chat.html` — dark theme, source citations, service tier selector |
| Seed data | ✅ Done | 43 devices, 84 repair quotes, 10 services, 3 tiers in `rag` schema |
| Schema separation | ✅ Done | Phase 1 (`public`) and Phase 2 RAG (`rag`) coexist without conflict |

---

## 2. Free Tier Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| Groq: 30 req/min, 14,400 req/day | Breaks under real traffic | Upgrade to paid Groq or switch LLM |
| API runs locally | Server stops on PC restart | Deploy to cloud (see Section 4) |
| No API authentication | Anyone on the network can call endpoints | Add API key header (see Section 4) |
| CPU-based embeddings | Re-embedding 210 chunks takes ~5 seconds | Acceptable at this scale |
| No response streaming | UI freezes until full answer arrives | Add streaming endpoint for production |
| No conversation memory | Each question is stateless, no chat history | Pass last N messages to LLM context |
| `time.sleep(1)` in API | Every response is 1 second slower | Required for Groq rate limit — remove on paid |

---

## 3. Critical Issues When Scaling to Paid Models

### 3.1 Embedding Dimension Mismatch — Highest Priority

Your Supabase column is hardcoded to `vector(384)` for `all-MiniLM-L6-v2`.  
Paid embedding models use **different dimensions** — you cannot mix them in the same column.

| Embedding Model | Dimensions | Cost |
|---|---|---|
| `all-MiniLM-L6-v2` (current) | **384** | Free — runs locally |
| OpenAI `text-embedding-3-small` | **1536** | ~$0.02 / 1M tokens |
| OpenAI `text-embedding-3-large` | **3072** | ~$0.13 / 1M tokens |
| Voyage AI (Anthropic partner) | **1024** | ~$0.06 / 1M tokens |

**What you must do when switching:**

```sql
-- Step 1: Drop old column
ALTER TABLE document_chunks DROP COLUMN embedding;

-- Step 2: Recreate with new dimension (example: 1536)
ALTER TABLE document_chunks ADD COLUMN embedding vector(1536);

-- Step 3: Update match_chunks() function signature
-- (change vector(384) → vector(1536) in schema_free.sql and re-run)
```

Then re-run the embedding pipeline with the new model. **All 210+ chunks must be re-embedded.**

---

### 3.2 Vector Index — Required at Scale

The IVFFlat index was dropped because it caused inaccurate results at 210 rows.  
At 1,000+ chunks you **must add an index** or search will become too slow.

**Use HNSW instead of IVFFlat** — better recall, no re-indexing needed as data grows:

```sql
-- Run this after re-embedding with paid model
CREATE INDEX ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

> **Rule of thumb:** No index below ~1,000 rows. HNSW above 1,000 rows.  
> IVFFlat requires `lists ≈ sqrt(total_rows)` and full reindex when rows grow significantly.

---

### 3.3 Supabase Connection Limits

| Tier | Max Connections | Action |
|---|---|---|
| Free | ~60 concurrent | Fine for demo |
| Pro ($25/mo) | 200+ | Enable PgBouncer pooler |
| Production | Unlimited (pooled) | Change port 5432 → 6543 in connection string |

For production, switch your Supabase URL to use the **connection pooler**:
```
# Instead of:
postgresql://...@db.xxx.supabase.co:5432/postgres

# Use:
postgresql://...@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

---

### 3.4 No Conversation Memory

Every query is independent — the bot does not remember earlier messages in the same chat.  
For production, maintain a rolling message history and pass it to the LLM:

```python
# Pass last 4 messages as context
messages = [
    {"role": "system", "content": system_prompt},
    *conversation_history[-4:],   # ← add this
    {"role": "user", "content": user_prompt},
]
```

Store conversation history in the frontend (sessionStorage) or in a Supabase `conversations` table.

---

### 3.5 Remove `time.sleep(1)` on Paid LLM

In `api/main_free.py` line 160, there is:
```python
time.sleep(1)   # Groq rate limit workaround
```

Remove this when switching to a paid LLM (OpenAI / Anthropic / Groq paid).  
It adds 1 unnecessary second to every single response.

---

## 4. Migration Checklist — Free → Paid Production

### Step 1: Upgrade Embedding Model
- [ ] Choose paid model (recommend OpenAI `text-embedding-3-small` for cost/quality balance)
- [ ] Update `MODEL_NAME` in `scripts/rag_pipeline_free.py`
- [ ] Update `vector(384)` → `vector(new_dim)` in `sql/schema_free.sql`
- [ ] Re-run `schema_free.sql` in Supabase (drop and recreate `document_chunks`)
- [ ] Re-run `rag_pipeline_free.py` to re-embed all chunks
- [ ] Add HNSW index (see Section 3.2)

### Step 2: Upgrade LLM
- [ ] Replace Groq with OpenAI/Anthropic in `api/main_free.py`
- [ ] Remove `time.sleep(1)`
- [ ] Update `requirements_free.txt` (add `openai` or `anthropic` package)
- [ ] Set new API key in `.env`

### Step 3: Add API Security
- [ ] Add API key middleware to FastAPI:
```python
from fastapi.security.api_key import APIKeyHeader

API_KEY = os.environ["API_SECRET_KEY"]
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_key(key: str = Depends(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403)
```

### Step 4: Add Conversation Memory
- [ ] Pass last N messages to LLM context
- [ ] Store history in sessionStorage (frontend) or Supabase (persistent)

### Step 5: Deploy API
- [ ] Deploy FastAPI to **Railway**, **Render**, or **Vercel** (not local uvicorn)
- [ ] Set environment variables on host platform
- [ ] Update `API` URL in `chat.html` from `localhost:8000` → production URL

### Step 6: Scale Supabase
- [ ] Upgrade to Supabase Pro if exceeding free tier limits
- [ ] Switch to PgBouncer connection pooler (port 6543)
- [ ] Enable Row Level Security policies for multi-tenant access

---

## 5. Cost Estimate at Production Scale

Assuming **1,000 queries/day** with OpenAI embeddings + GPT-4o mini:

| Service | Usage | Est. Monthly Cost |
|---|---|---|
| OpenAI Embeddings (3-small) | Re-embed on content update only | ~$1 |
| OpenAI GPT-4o mini | 1,000 req/day × 1K tokens avg | ~$6 |
| Supabase Pro | Hosted DB + vector storage | $25 |
| Render/Railway (API hosting) | Always-on FastAPI | $5–$10 |
| **Total** | | **~$37–$42/month** |

At **10,000 queries/day** (Mister Mobile production scale):

| Service | Est. Monthly Cost |
|---|---|
| OpenAI GPT-4o mini (10K req/day) | ~$60 |
| Supabase Pro | $25 |
| Hosting | $10–$20 |
| **Total** | **~$95–$105/month** |

---

## 6. Files to Update When Migrating

| File | What to Change |
|---|---|
| `sql/schema_free.sql` | `vector(384)` → `vector(new_dim)` in column + `match_chunks()` |
| `scripts/rag_pipeline_free.py` | `MODEL_NAME` → new embedding model |
| `api/main_free.py` | LLM client, remove `sleep(1)`, add auth middleware |
| `requirements_free.txt` | Add new SDK, remove unused packages |
| `chat.html` | Update `API` const from `localhost:8000` → production URL |
| `.env` | Add new API keys, remove old ones |

---

*Generated for Mister Mobile Phase 2 RAG System — Free Demo Stack*
