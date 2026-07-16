"""
main.py
=======
Entry point for the Journal AI FastAPI micro-service.

Start with:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload --reload-include "*.py"

Environment variables are loaded from .env automatically via embedding_service.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.journal_routes import router as journal_router

# Import Memory Retrieval Dependencies
from pymongo import MongoClient
from memory.repositories.memory_repository import MongoMemoryRepository
from memory.repositories.memory_fragment_repository import MongoMemoryFragmentRepository
from capture.repositories.knowledge_repository import MongoKnowledgeRepository
from memory.retrieval.question_analysis_service import QuestionAnalysisService
from memory.retrieval.memory_ranker import MemoryRanker
from memory.retrieval.context_builder import ContextBuilder
from memory.retrieval.memory_retrieval_engine import MemoryRetrievalEngine
from memory.retrieval.retrieval_gateway import RetrievalGateway

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB Client
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db_name = os.getenv("MONGO_DB_NAME", "journaldb")
    client = MongoClient(mongo_uri)
    db = client[mongo_db_name]

    # Initialize Repositories
    memory_repo = MongoMemoryRepository(db)
    fragment_repo = MongoMemoryFragmentRepository(db)
    knowledge_repo = MongoKnowledgeRepository(db)
    
    from capture.repositories.entity_repository import MongoEntityRepository
    from insight.repositories.insight_repository import MongoInsightRepository
    entity_repo = MongoEntityRepository(db)
    insight_repo = MongoInsightRepository(db)

    # Initialize Retrieval Services
    qa_service = QuestionAnalysisService()
    ranker = MemoryRanker()
    context_builder = ContextBuilder()

    # Initialize Memory Retrieval Engine
    memory_engine = MemoryRetrievalEngine(
        memory_repo=memory_repo,
        fragment_repo=fragment_repo,
        knowledge_repo=knowledge_repo,
        question_analyzer=qa_service,
        ranker=ranker,
        context_builder=context_builder
    )

    # Initialize Retrieval Gateway
    gateway = RetrievalGateway(memory_engine=memory_engine)
    
    # Initialize Capture Pipeline
    from capture.services.extraction_service import ExtractionService
    from capture.services.resolution_service import ResolutionService
    from capture.capture_pipeline import CapturePipeline
    extraction_svc = ExtractionService()
    resolution_svc = ResolutionService(entity_repository=entity_repo)
    capture_pipeline = CapturePipeline(
        extraction_service=extraction_svc,
        resolution_service=resolution_svc,
        knowledge_repository=knowledge_repo
    )
    
    # Initialize Memory Formation Engine
    from memory.services.memory_formation_engine import MemoryFormationEngine
    memory_formation = MemoryFormationEngine(
        memory_repository=memory_repo,
        fragment_repository=fragment_repo
    )
    
    # Initialize Insight Services
    from insight.services.candidate_generation_service import CandidateGenerationService
    from insight.services.insight_validation_service import InsightValidationService
    from insight.services.insight_consolidation_service import InsightConsolidationService
    candidate_gen = CandidateGenerationService()
    insight_val = InsightValidationService()
    insight_con = InsightConsolidationService(repository=insight_repo)
    
    # Initialize Cognitive Orchestrator
    from orchestration.cognitive_orchestrator import CognitiveOrchestrator
    orchestrator = CognitiveOrchestrator(
        capture_pipeline=capture_pipeline,
        memory_engine=memory_formation,
        memory_repo=memory_repo,
        candidate_gen=candidate_gen,
        insight_val=insight_val,
        insight_con=insight_con
    )
    
    # Inject into application state
    app.state.retrieval_gateway = gateway
    app.state.orchestrator = orchestrator
    
    # Expose repos for debug endpoints
    app.state.knowledge_repo = knowledge_repo
    app.state.memory_repo = memory_repo
    app.state.insight_repo = insight_repo
    
    yield
    
    # Teardown
    client.close()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    lifespan=lifespan,
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

from routes.debug_routes import router as debug_router
app.include_router(debug_router)


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
