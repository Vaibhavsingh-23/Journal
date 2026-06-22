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

from fastapi import APIRouter, HTTPException, File, UploadFile, Query
from pydantic import BaseModel, Field

from services.embedding_service import embed_single_entry, embed_all_entries
from services.rag_service import ask_journal
from services.voice_service import transcribe_audio, save_temp_audio, cleanup_temp_file

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
def embed_entry(req: EmbedEntryRequest):
    """
    Embed a single journal entry and store it in ChromaDB.

    Called by the Spring backend each time a new entry is created or updated.
    Safe to call multiple times for the same entry_id — uses upsert internally.
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
def query(req: QueryRequest):
    """
    Answer a natural-language question using the user's journal entries as context.

    RAG pipeline:
        1. Converts question -> embedding vector
        2. Semantic search in ChromaDB (filtered by user_id)
        3. Passes top-5 results to Gemini (gemini-1.5-flash) for a grounded answer

    Returns the answer text and the ISO dates of entries used as sources.
    """
    if not req.user_id or not req.question:
        raise HTTPException(status_code=400, detail="user_id and question are required")

    result = ask_journal(
        question=req.question,
        user_id=req.user_id,
    )

    # If a hard error occurred (no answer generated at all), surface as 500
    if "error" in result and not result.get("answer"):
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.post("/voice/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    user_id: str = Query(...)
):
    """
    Receive audio file from frontend,
    transcribe using local Whisper model,
    return transcript + detected language
    
    Called by: voice-journal.html frontend
    """
    temp_path = None
    try:
        # Read uploaded audio bytes
        contents = await audio.read()
        
        # Get file extension (webm, mp4, wav etc)
        extension = audio.filename.split(".")[-1] if "." in audio.filename else "webm"
        
        # Save to temp file
        temp_path = save_temp_audio(contents, extension)
        
        # Transcribe using Whisper
        result = transcribe_audio(temp_path)
        
        # Check if transcription failed
        if result["status"] == "error":
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {result['message']}"
            )
        
        # Return transcript
        return {
            "transcript": result["transcript"],
            "language": result["language"],
            "user_id": user_id,
            "status": "success"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice processing failed: {str(e)}"
        )
    
    finally:
        # Always cleanup temp file
        if temp_path:
            cleanup_temp_file(temp_path)

