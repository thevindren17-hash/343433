"""
Mister Mobile RAG API (Free Stack)
FastAPI + Groq (llama-3.3-70b-versatile) + Supabase pgvector + sentence-transformers

Start: uvicorn api.main_free:app --reload --port 8000

Test:
  curl -X POST http://localhost:8000/api/quote \
    -H "Content-Type: application/json" \
    -d '{"query": "iPhone 15 Pro Max screen cost?", "brand_hint": "Apple", "service_tier": "express"}'
"""
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
from groq import Groq

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
GROQ_MODEL = "llama-3.3-70b-versatile"
DEFAULT_THRESHOLD = 0.40
DEFAULT_TOP_K = 8

app = FastAPI(
    title="Mister Mobile RAG API",
    description="Quote and information retrieval for Mister Mobile phone repair shop.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loaded once at startup — SentenceTransformer caches the model after first download
_embedding_model: SentenceTransformer | None = None
_supabase: Client | None = None
_groq: Groq | None = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase


def get_groq() -> Groq:
    global _groq
    if _groq is None:
        _groq = Groq(api_key=GROQ_API_KEY)
    return _groq


# --------------------------------------------------------------------------- #
# Request / Response models
# --------------------------------------------------------------------------- #

class QuoteRequest(BaseModel):
    query: str
    brand_hint: str | None = None
    service_tier: str | None = "standard"
    match_threshold: float = DEFAULT_THRESHOLD
    top_k: int = DEFAULT_TOP_K


class SourceChunk(BaseModel):
    chunk_id: str
    chunk_type: str
    similarity: float
    excerpt: str


class QuoteResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    model: str
    chunks_found: int


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #

@app.get("/health")
def health():
    return {"status": "ok", "embedding_model": MODEL_NAME, "llm": GROQ_MODEL}


@app.post("/api/quote", response_model=QuoteResponse)
def get_quote(req: QuoteRequest):
    # Build enriched query text for embedding
    query_parts = [req.query]
    if req.brand_hint:
        query_parts.append(req.brand_hint)
    if req.service_tier and req.service_tier != "standard":
        query_parts.append(f"{req.service_tier} tier")
    query_text = " ".join(query_parts)

    # Embed
    model = get_embedding_model()
    embedding = model.encode(query_text).tolist()

    # Retrieve from Supabase
    supabase = get_supabase()
    result = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": embedding,
            "match_threshold": req.match_threshold,
            "match_count": req.top_k,
        },
    ).execute()

    chunks = result.data or []
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No relevant information found above similarity threshold {req.match_threshold}. "
                "Try rephrasing your query or lowering match_threshold to 0.45."
            ),
        )

    # Build context for the LLM
    context_lines = [
        f"[{c['chunk_type'].upper()}] {c['content']}"
        for c in chunks
    ]
    context = "\n\n".join(context_lines)

    system_prompt = (
        "You are a helpful customer service assistant for Mister Mobile, a professional mobile phone repair shop. "
        "Answer the customer's question using ONLY the information provided in the context below. "
        "Be specific about prices and turnaround times when the context contains them. "
        "If the context does not contain the answer, say so clearly and suggest the customer call us. "
        "Keep your answer concise and friendly."
    )

    user_prompt = (
        f"Customer query: {req.query}\n"
        f"Preferred service tier: {req.service_tier or 'not specified'}\n"
        f"Device brand: {req.brand_hint or 'not specified'}\n\n"
        f"Context:\n{context}\n\n"
        "Please answer the customer's query based on the context above."
    )

    # Groq free tier: 30 req/min — brief sleep prevents hitting the limit in bulk use
    time.sleep(1)

    groq_client = get_groq()
    chat = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=512,
        temperature=0.2,
    )

    answer = chat.choices[0].message.content

    sources = [
        SourceChunk(
            chunk_id=c["chunk_id"],
            chunk_type=c["chunk_type"],
            similarity=round(float(c["similarity"]), 3),
            excerpt=c["content"][:150] + "..." if len(c["content"]) > 150 else c["content"],
        )
        for c in chunks
    ]

    return QuoteResponse(
        answer=answer,
        sources=sources,
        model=GROQ_MODEL,
        chunks_found=len(chunks),
    )
