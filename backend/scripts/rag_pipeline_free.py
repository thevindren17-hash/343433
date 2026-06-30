"""
Mister Mobile RAG Pipeline (Free Stack)
Embeds rag_chunks.json using sentence-transformers (384-dim) and upserts to Supabase.
Run: python3 scripts/rag_pipeline_free.py
"""
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
BATCH_SIZE = 50
DATA_FILE = Path(__file__).parent.parent / "data" / "rag_chunks.json"


def load_chunks() -> list[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        chunks = json.load(f)
    print(f"Loaded {len(chunks)} chunks from {DATA_FILE}")
    return chunks


def embed_chunks(model: SentenceTransformer, chunks: list[dict]) -> list[list[float]]:
    texts = [c["content"] for c in chunks]
    print(f"Generating embeddings for {len(texts)} chunks (model: {MODEL_NAME})...")
    print("  First run downloads ~90MB model to ~/.cache/huggingface/ — cached afterwards.")
    embeddings = model.encode(texts, batch_size=BATCH_SIZE, show_progress_bar=True)
    print(f"  Embeddings shape: {embeddings.shape}  (expected: ({len(texts)}, 384))")
    return [e.tolist() for e in embeddings]


def upsert_to_supabase(supabase: Client, chunks: list[dict], embeddings: list[list[float]]) -> None:
    rows = [
        {
            "chunk_id": chunk["chunk_id"],
            "chunk_type": chunk["chunk_type"],
            "content": chunk["content"],
            "metadata": chunk.get("metadata", {}),
            "embedding": embedding,
        }
        for chunk, embedding in zip(chunks, embeddings)
    ]

    print(f"Upserting {len(rows)} rows to Supabase (batches of {BATCH_SIZE})...")
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        supabase.table("document_chunks").upsert(batch, on_conflict="chunk_id").execute()
        print(f"  Upserted rows {i + 1}–{min(i + BATCH_SIZE, len(rows))}")


def verify(supabase: Client) -> None:
    result = (
        supabase.table("document_chunks")
        .select("chunk_id, chunk_type")
        .limit(3)
        .execute()
    )
    print("\nVerification sample (first 3 rows):")
    for row in result.data:
        print(f"  {row['chunk_id']}  ({row['chunk_type']})")

    count_result = supabase.table("document_chunks").select("id", count="exact").execute()
    total = count_result.count
    print(f"\nTotal rows in document_chunks: {total}")
    print("To verify embedding dimensions, run in Supabase SQL Editor:")
    print("  SELECT chunk_id, array_length(embedding::float[], 1) AS dims")
    print("  FROM document_chunks WHERE embedding IS NOT NULL LIMIT 3;")
    print("  -- Expected: dims = 384")


def main() -> None:
    print("=== Mister Mobile RAG Pipeline (Free Stack) ===\n")

    t0 = time.time()

    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    chunks = load_chunks()
    embeddings = embed_chunks(model, chunks)

    print("\nConnecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    upsert_to_supabase(supabase, chunks, embeddings)
    verify(supabase)

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s — {len(chunks)} chunks embedded and stored.")


if __name__ == "__main__":
    main()
