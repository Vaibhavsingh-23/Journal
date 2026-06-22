"""
embedding_service.py
====================
Handles conversion of journal entry text into vector embeddings using
Google's Gemini Embedding API, and persists them in a local ChromaDB store.

Environment variables (loaded from .env):
    GOOGLE_API_KEY        - Gemini API key
    CHROMA_PERSIST_PATH   - Local path for ChromaDB persistent storage (default: ./chroma_store)
    MONGO_URI             - MongoDB Atlas connection string
    MONGO_DB_NAME         - MongoDB database name (e.g. journaldb)
"""

import os
import logging
from typing import Optional

from dotenv import load_dotenv
import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Clients — initialised once at module level (singleton pattern)
# ---------------------------------------------------------------------------

# Gemini embedding model
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
)

# ChromaDB persistent client
_chroma_path = os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")
chroma_client = chromadb.PersistentClient(path=_chroma_path)

# ChromaDB collection — created if it does not already exist
collection = chroma_client.get_or_create_collection(
    name="journal_entries",
    metadata={"hnsw:space": "cosine"},  # cosine similarity for semantic search
)

log.info("ChromaDB initialised at '%s'. Collection: 'journal_entries'.", _chroma_path)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def embed_single_entry(
    entry_id: str,
    text: str,
    user_id: str,
    date: str,
) -> dict:
    """
    Embed a single journal entry and upsert it into ChromaDB.

    Args:
        entry_id (str): Unique MongoDB ObjectId string of the journal entry.
        text     (str): Plain-text content of the journal entry.
        user_id  (str): Owning user's ObjectId string (used for filtering).
        date     (str): ISO-8601 date string of the entry (e.g. "2026-06-20").

    Returns:
        dict: {"status": "embedded", "entry_id": entry_id}
              {"status": "error",    "entry_id": entry_id, "detail": str}
    """
    if not text or not text.strip():
        log.warning("embed_single_entry: empty text for entry_id=%s — skipping.", entry_id)
        return {"status": "error", "entry_id": entry_id, "detail": "Empty text"}

    try:
        log.info("Embedding entry_id=%s for user_id=%s …", entry_id, user_id)

        # Generate embedding vector
        vector: list[float] = embeddings.embed_query(text)

        # Upsert into ChromaDB (add replaces a document with the same id)
        collection.upsert(
            ids=[entry_id],
            embeddings=[vector],
            documents=[text],
            metadatas=[
                {
                    "user_id": user_id,
                    "date": date,
                    "entry_id": entry_id,
                }
            ],
        )

        log.info("Successfully embedded entry_id=%s.", entry_id)
        return {"status": "embedded", "entry_id": entry_id}

    except Exception as exc:  # noqa: BLE001
        log.error("Failed to embed entry_id=%s: %s", entry_id, exc, exc_info=True)
        return {"status": "error", "entry_id": entry_id, "detail": str(exc)}


def embed_all_entries(user_id: str) -> dict:
    """
    Fetch every journal entry for *user_id* from MongoDB and embed them all
    into ChromaDB in one batch operation.

    Entries that already exist in ChromaDB are silently overwritten (upsert).
    Entries with empty content are skipped.

    Args:
        user_id (str): The owning user's ObjectId string.

    Returns:
        dict: {
                  "status":         "done" | "error",
                  "embedded_count": int,    # number successfully embedded
                  "skipped_count":  int,    # entries skipped (empty / error)
                  "detail":         str,    # only present on top-level error
              }
    """
    mongo_uri     = os.getenv("MONGO_URI")
    mongo_db_name = os.getenv("MONGO_DB_NAME", "journaldb")

    if not mongo_uri:
        log.error("embed_all_entries: MONGO_URI is not set.")
        return {"status": "error", "embedded_count": 0, "detail": "MONGO_URI not configured"}

    client: Optional[MongoClient] = None
    embedded_count = 0
    skipped_count  = 0

    try:
        log.info("Connecting to MongoDB for bulk embed (user_id=%s) …", user_id)
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10_000)
        db = client[mongo_db_name]

        # Try both common collection names used in the Spring backend
        entries_collection = _resolve_entries_collection(db)

        # Build query — MongoDB stores userId as ObjectId; accept string comparison too
        query = _build_user_query(user_id)
        entries = list(entries_collection.find(query))

        log.info("Found %d entries for user_id=%s.", len(entries), user_id)

        for entry in entries:
            eid     = str(entry.get("_id", ""))
            content = entry.get("content", "")
            date    = _extract_date(entry)

            if not content or not content.strip():
                log.debug("Skipping entry_id=%s — no content.", eid)
                skipped_count += 1
                continue

            result = embed_single_entry(
                entry_id=eid,
                text=content,
                user_id=user_id,
                date=date,
            )

            if result["status"] == "embedded":
                embedded_count += 1
            else:
                skipped_count += 1

        log.info(
            "Bulk embed complete: embedded=%d, skipped=%d (user_id=%s).",
            embedded_count,
            skipped_count,
            user_id,
        )
        return {
            "status":         "done",
            "embedded_count": embedded_count,
            "skipped_count":  skipped_count,
        }

    except PyMongoError as exc:
        log.error("MongoDB error during bulk embed for user_id=%s: %s", user_id, exc, exc_info=True)
        return {
            "status":         "error",
            "embedded_count": embedded_count,
            "detail":         f"MongoDB error: {exc}",
        }
    except Exception as exc:  # noqa: BLE001
        log.error("Unexpected error during bulk embed for user_id=%s: %s", user_id, exc, exc_info=True)
        return {
            "status":         "error",
            "embedded_count": embedded_count,
            "detail":         str(exc),
        }
    finally:
        if client:
            client.close()
            log.debug("MongoDB connection closed.")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _resolve_entries_collection(db):
    """Return the correct MongoDB collection for journal entries.

    The Spring backend may use either 'entries' or 'journal_entries'.
    Prefers 'journal_entries' if it exists and is non-empty, otherwise
    falls back to 'entries'.
    """
    existing = db.list_collection_names()
    if "journal_entries" in existing:
        return db["journal_entries"]
    return db["entries"]


def _build_user_query(user_id: str) -> dict:
    """Build a MongoDB filter that matches entries owned by *user_id*.

    The Spring backend stores userId as a native ObjectId. We try to
    match it both ways so this service works regardless of driver version.
    """
    try:
        from bson import ObjectId  # bundled with pymongo — always available

        return {"$or": [{"userId": ObjectId(user_id)}, {"userId": user_id}]}
    except Exception:  # noqa: BLE001
        return {"userId": user_id}


def _extract_date(entry: dict) -> str:
    """Extract a date string from a MongoDB journal entry document.

    Handles both datetime objects and ISO strings stored under 'date'
    or 'createdAt' fields.
    """
    for field in ("date", "createdAt", "created_at"):
        val = entry.get(field)
        if val is None:
            continue
        if hasattr(val, "isoformat"):
            return val.isoformat()
        return str(val)
    return ""
