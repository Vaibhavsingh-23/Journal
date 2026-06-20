"""
main.py
=======
Entry point for the Journal AI FastAPI micro-service.

Start with:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Environment variables are loaded from .env automatically via embedding_service.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.journal_routes import router as journal_router

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Journal AI Service",
    description=(
        "RAG-powered AI layer for the Journal App. "
        "Embeds journal entries via Gemini and answers questions using ChromaDB retrieval."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow requests from the Spring backend and the frontend
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",        # Spring backend (local)
        "http://localhost:5500",        # VS Code Live Server
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "https://journal-frontend-v45t.onrender.com",   # deployed frontend
        "https://journal-backend.onrender.com",         # deployed Spring backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(journal_router)


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    """Service info."""
    return {
        "service": "Journal AI",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health":     "GET  /ai/health",
            "embed_one":  "POST /ai/embed/entry",
            "embed_all":  "POST /ai/embed/all",
            "rag_query":  "POST /ai/query",
        },
    }
