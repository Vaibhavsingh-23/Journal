"""
rag_service.py
==============
Retrieval-Augmented Generation (RAG) pipeline for the Journal AI service.

How RAG works here:
    1. The user's question is converted to an embedding vector (Gemini embedding).
    2. ChromaDB performs a semantic similarity search and returns the top-5
       journal entries most relevant to the question — filtered by user_id so
       one user can never see another's entries.
    3. Those entries are injected as context into a prompt sent to Gemini
       (gemini-1.5-flash), which generates a grounded, natural-language answer.

Environment variables (resolved via embedding_service's load_dotenv call):
    GEMINI_API_KEY - Google Gemini API key used for generative responses.
                     The embedding model uses GOOGLE_API_KEY (see embedding_service.py).

Run from the project root:
    uvicorn main:app --reload
"""

import os
import logging
from datetime import datetime

import google.genai as genai
from google.genai import types as genai_types
from dotenv import load_dotenv

# Re-use the already-initialised singleton clients from embedding_service.
# Both files live in the same `services/` package; the FastAPI app is started
# from the project root so the module path is `services.embedding_service`.
try:
    # When imported as part of the FastAPI app (from project root)
    from services.embedding_service import embeddings, collection
except ModuleNotFoundError:
    # When run / tested directly inside the services/ directory
    from embedding_service import embeddings, collection  # type: ignore

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini generative model — initialised once at module level
# ---------------------------------------------------------------------------

genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))

# Fallback chain — tried in order when a model hits its free-tier quota limit.
# gemini-2.5-flash  : latest, most capable, separate quota pool from 2.0
# gemini-2.0-flash-lite : lighter model, higher free-tier RPM
# gemini-2.5-flash-lite : smallest/fastest, last resort
MODEL_FALLBACK_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
]

log.info("Gemini generative models configured: %s", MODEL_FALLBACK_CHAIN)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _generate_with_fallback(prompt: str) -> str:
    """
    Try each model in MODEL_FALLBACK_CHAIN in order.

    If a model returns a 429 / ResourceExhausted quota error, the next model
    in the chain is tried.  Any other exception is re-raised immediately so
    the caller's error handler can log and surface it.

    Args:
        prompt (str): The fully-constructed prompt string to send to Gemini.

    Returns:
        str: The generated text from the first model that succeeds.

    Raises:
        Exception: Re-raises the last exception if every model in the chain
                   fails for a non-quota reason, or if all models exhaust
                   their quota.
    """
    last_exc: Exception | None = None

    for model_name in MODEL_FALLBACK_CHAIN:
        try:
            log.info("Trying generative model: %s", model_name)
            response = genai_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.7,
                ),
            )
            return response.text or ""
        except Exception as exc:  # noqa: BLE001
            err_str = str(exc).lower()
            is_quota_error = (
                "429" in err_str
                or "resource_exhausted" in err_str
                or "quota" in err_str
                or "rate limit" in err_str
            )
            if is_quota_error:
                log.warning(
                    "Model %s hit quota/rate-limit, trying next fallback. Error: %s",
                    model_name,
                    exc,
                )
                last_exc = exc
                continue  # try the next model
            # Non-quota error — re-raise immediately
            raise

    # All models exhausted
    raise last_exc or RuntimeError("All Gemini models in the fallback chain failed.")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def ask_journal(question: str, user_id: str) -> dict:
    """
    RAG pipeline — answer a natural-language question from a user's journal.

    Steps:
        1. Embed the question using the Gemini embedding model.
        2. Query ChromaDB for the 5 most semantically similar entries
           belonging to *user_id*.
        3. If no entries are found, return a friendly fallback message.
        4. Build a context string from the retrieved entries.
        5. Send a grounded prompt to Gemini (gemini-1.5-flash).
        6. Return the answer and the source dates used.

    Args:
        question (str): Natural-language question about the user's journal,
                        e.g. "What made me happy last month?".
        user_id  (str): MongoDB ObjectId string of the authenticated user.
                        Used as a ChromaDB metadata filter so results are
                        always scoped to the requesting user only.

    Returns:
        dict: On success —
              {
                  "answer":  str,        # Gemini's grounded answer
                  "sources": list[str],  # ISO date strings of entries used
              }
              On no entries found —
              {
                  "answer":  str,  # friendly fallback message
                  "sources": [],
              }
              On API / unexpected error —
              {
                  "answer":  str,  # user-friendly error message
                  "sources": [],
                  "error":   str,  # technical detail (for server-side logging)
              }

    Raises:
        Does not raise — all exceptions are caught and returned in the dict.
    """
    if not question or not question.strip():
        log.warning("ask_journal called with empty question (user_id=%s).", user_id)
        return {
            "answer": "Please provide a question.",
            "sources": [],
        }

    try:
        # ── Step 1: Embed the question ────────────────────────────────────────
        log.info("Embedding question for RAG (user_id=%s): '%s'", user_id, question[:80])
        question_vector: list[float] = embeddings.embed_query(question)

        # ── Step 2: Semantic search in ChromaDB (scoped to this user) ─────────
        results = collection.query(
            query_embeddings=[question_vector],
            n_results=5,
            where={"user_id": user_id},
            include=["documents", "metadatas"],
        )

        retrieved_docs: list[str] = results.get("documents", [[]])[0]
        retrieved_meta: list[dict] = results.get("metadatas", [[]])[0]

        # ── Step 3: Handle no results ─────────────────────────────────────────
        if not retrieved_docs:
            log.info("No journal entries found in ChromaDB for user_id=%s.", user_id)
            return {
                "answer": (
                    "You haven't written enough entries yet for me to answer that."
                ),
                "sources": [],
            }

        # ── Step 4: Build context string ──────────────────────────────────────
        context_parts: list[str] = []
        raw_sources: list[datetime] = []

        for doc, meta in zip(retrieved_docs, retrieved_meta):
            raw_date = meta.get("date", "")
            
            formatted_date = "unknown date"
            if raw_date:
                try:
                    dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                    formatted_date = dt.strftime("%B %d, %Y")
                    raw_sources.append(dt)
                except ValueError:
                    formatted_date = raw_date
            
            context_parts.append(f"Entry from {formatted_date}:\n{doc}")

        # Deduplicate by turning into a set, sort descending, then format
        unique_dates = sorted(list(set(raw_sources)), reverse=True)
        sources = [dt.strftime("%B %d, %Y") for dt in unique_dates]

        context = "\n\n---\n\n".join(context_parts)

        # ── Step 5: Build the RAG prompt ──────────────────────────────────────
        prompt = (
            "You are a personal journal assistant. "
            "Based ONLY on these journal entries, answer the question. "
            "Write in a warm, personal, and empathetic tone. "
            "Speak directly to the user as 'you'. "
            "Write in flowing paragraphs. Do NOT use markdown asterisks or bullet points. "
            "Keep your answer concise (maximum 3-4 sentences).\n\n"
            f"Journal Entries:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )

        # ── Step 6: Call Gemini with automatic model fallback on quota errors ────
        log.info("Sending prompt to Gemini (sources=%d entries).", len(retrieved_docs))
        answer: str = _generate_with_fallback(prompt)

        log.info(
            "RAG complete for user_id=%s — used %d entries, sources=%s.",
            user_id,
            len(retrieved_docs),
            sources,
        )

        # ── Step 7: Return answer + sources ───────────────────────────────────
        return {
            "answer": answer,
            "sources": sources,
        }

    except Exception as exc:  # noqa: BLE001
        log.error(
            "RAG pipeline failed for user_id=%s, question='%s': %s",
            user_id,
            question[:80],
            exc,
            exc_info=True,
        )
        return {
            "answer": (
                "Sorry, I was unable to process your question right now. "
                "Please try again in a moment."
            ),
            "sources": [],
            "error": str(exc),
        }
