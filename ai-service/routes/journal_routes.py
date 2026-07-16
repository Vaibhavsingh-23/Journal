"""
journal_routes.py
=================
FastAPI router exposing all AI-service endpoints.

Endpoints:
    GET  /ai/health        — liveness check
    POST /ai/embed/entry   — embed a single journal entry into ChromaDB
    POST /ai/embed/all     — bulk-embed all entries for a user from MongoDB
    POST /ai/query         — RAG: answer a question from journal context
"""

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from pydantic import BaseModel, Field

from services.embedding_service import embed_single_entry, embed_all_entries
from dependencies import get_retrieval_gateway, get_cognitive_orchestrator
from memory.retrieval.retrieval_gateway import RetrievalGateway
from orchestration.cognitive_orchestrator import CognitiveOrchestrator

router = APIRouter(prefix="/ai", tags=["AI Journal"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class EmbedEntryRequest(BaseModel):
    """Payload for embedding a single journal entry."""

    entry_id: str = Field(..., description="MongoDB ObjectId string of the journal entry")
    text: str     = Field(..., description="Plain-text content of the journal entry")
    user_id: str  = Field(..., description="MongoDB ObjectId string of the owning user")
    date: str     = Field("",  description="ISO-8601 date of the entry (e.g. 2026-06-20)")


class EmbedAllRequest(BaseModel):
    """Payload for bulk-embedding all entries for a user."""

    user_id: str = Field(..., description="MongoDB ObjectId string of the user")


class QueryRequest(BaseModel):
    """Payload for a RAG query."""

    user_id: str  = Field(..., description="MongoDB ObjectId string of the user")
    question: str = Field(..., description="Natural-language question about their journal")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/health")
def health():
    """Confirm the AI service is running."""
    return {"status": "ok", "service": "Journal AI"}


@router.post("/embed/entry")
def embed_entry(
    req: EmbedEntryRequest, 
    background_tasks: BackgroundTasks,
    orchestrator: CognitiveOrchestrator = Depends(get_cognitive_orchestrator)
):
    """
    Embed a single journal entry and store it in ChromaDB.

    Called by the Spring backend each time a new entry is created or updated.
    Safe to call multiple times for the same entry_id — uses upsert internally.
    Triggers the Cognitive Pipeline asynchronously.
    """
    if not req.entry_id or not req.text or not req.user_id:
        raise HTTPException(
            status_code=400,
            detail="entry_id, text, and user_id are required",
        )

    result = embed_single_entry(
        entry_id=req.entry_id,
        text=req.text,
        user_id=req.user_id,
        date=req.date,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("detail", "Embedding failed"))

    # Trigger asynchronous cognitive processing
    background_tasks.add_task(
        orchestrator.run_pipeline,
        entry_id=req.entry_id,
        text=req.text,
        user_id=req.user_id,
        date=req.date
    )

    return result


@router.post("/embed/all")
def embed_all(req: EmbedAllRequest):
    """
    Bulk-embed all existing journal entries for a user from MongoDB.

    Useful on first setup or after a data migration. Safe to call multiple
    times — existing vectors are upserted (overwritten).
    """
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    result = embed_all_entries(user_id=req.user_id)

    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("detail", "Bulk embed failed"))

    return result


@router.post("/query")
def query(req: QueryRequest, gateway: RetrievalGateway = Depends(get_retrieval_gateway)):
    """
    Answer a natural-language question using the user's journal entries as context.

    Retrieval Pipeline:
        1. Invokes the RetrievalGateway.
        2. Tries to pull semantic structure from Memory Retrieval Engine.
        3. Falls back to Pinecone Document RAG if no memory is found.

    Returns the answer text, sources, and the engine used.
    """
    if not req.user_id or not req.question:
        raise HTTPException(status_code=400, detail="user_id and question are required")

    result = gateway.answer_question(
        question=req.question,
        user_id=req.user_id,
    )

    # If a hard error occurred (no answer generated at all), surface as 500
    if "error" in result and not result.get("answer"):
        raise HTTPException(status_code=500, detail=result["error"])

    return result



