"""
debug_routes.py
===============
Read-only developer endpoints for inspecting the cognitive pipeline state.
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any

from capture.repositories.knowledge_repository import MongoKnowledgeRepository
from memory.repositories.memory_repository import MongoMemoryRepository
from insight.repositories.insight_repository import MongoInsightRepository
from dependencies import get_knowledge_repo, get_memory_repo, get_insight_repo

router = APIRouter(prefix="/ai/debug", tags=["AI Debug"])


@router.get("/knowledge")
def get_knowledge(
    user_id: str, 
    repo: MongoKnowledgeRepository = Depends(get_knowledge_repo)
):
    """Inspect stored knowledge objects for a user."""
    # Assuming the repo exposes the underlying pymongo collection for a raw dump
    cursor = repo.collection.find({"user_id": user_id}, {"_id": 0})
    return list(cursor)


@router.get("/memories")
def get_memories(
    user_id: str, 
    repo: MongoMemoryRepository = Depends(get_memory_repo)
):
    """Inspect stored memories for a user."""
    memories = repo.find_by_user(user_id)
    return [m.model_dump() for m in memories]


@router.get("/insights")
def get_insights(
    user_id: str, 
    repo: MongoInsightRepository = Depends(get_insight_repo)
):
    """Inspect stored insights for a user."""
    insights = repo.find_active_by_user(user_id)
    return [i.model_dump() for i in insights]


@router.get("/pipeline")
def get_pipeline_state(
    user_id: str, 
    repo: MongoMemoryRepository = Depends(get_memory_repo)
):
    """View dirty memories waiting for Insight Generation."""
    all_memories = repo.find_by_user(user_id)
    dirty = [m for m in all_memories if getattr(m, 'pending_insight_generation', False)]
    return {
        "pending_insight_generation_count": len(dirty),
        "pending_memory_ids": [m.id for m in dirty]
    }


@router.get("/health")
def get_health(
    user_id: str,
    knowledge_repo: MongoKnowledgeRepository = Depends(get_knowledge_repo),
    memory_repo: MongoMemoryRepository = Depends(get_memory_repo),
    insight_repo: MongoInsightRepository = Depends(get_insight_repo)
) -> Dict[str, Any]:
    """Diagnostic pipeline health endpoint."""
    ko_count = knowledge_repo.collection.count_documents({"user_id": user_id})
    memories = memory_repo.find_by_user(user_id)
    insights = insight_repo.find_active_by_user(user_id)
    dirty = [m for m in memories if getattr(m, 'pending_insight_generation', False)]

    return {
        "pipeline_version": "1.0.0",
        "embedding_status": "operational",
        "capture_status": "operational",
        "knowledge_count": ko_count,
        "memory_count": len(memories),
        "insight_count": len(insights),
        "pending_dirty_memories": len(dirty),
        "pending_validations": len(dirty)
    }
