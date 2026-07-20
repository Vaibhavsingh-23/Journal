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
from capture.repositories.entity_repository import MongoEntityRepository
from dependencies import get_knowledge_repo, get_memory_repo, get_insight_repo, get_entity_repo

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

@router.get("/graph")
def get_graph(
    user_id: str,
    memory_repo: MongoMemoryRepository = Depends(get_memory_repo),
    entity_repo: MongoEntityRepository = Depends(get_entity_repo),
    insight_repo: MongoInsightRepository = Depends(get_insight_repo)
):
    """Generate ForceGraph2D compatible graph data from actual memories and entities."""
    memories = memory_repo.find_by_user(user_id)
    # Get all entities for this user
    entities_cursor = entity_repo.collection.find({"user_id": user_id})
    entities = {str(e["id"]): e for e in entities_cursor}
    
    insights = insight_repo.find_active_by_user(user_id)
    
    nodes = []
    links = []
    
    for m in memories:
        nodes.append({
            "id": m.id,
            "label": m.title or "Memory",
            "type": "memory",
            "group": "memory",
            "val": 6
        })
        for e_id in getattr(m, 'entityIds', getattr(m, 'entity_ids', [])):
            if str(e_id) in entities:
                links.append({"source": m.id, "target": str(e_id)})
                
    for e_id, e in entities.items():
        nodes.append({
            "id": e_id,
            "label": e.get("name", "Entity"),
            "type": "entity",
            "group": "entity",
            "val": 4
        })
        
    for i in insights:
        nodes.append({
            "id": i.id,
            "label": getattr(i, 'title', getattr(i, 'type', 'Insight')),
            "type": "insight",
            "group": "insight",
            "val": 5
        })
        for m_id in getattr(i, 'supportingMemoryIds', getattr(i, 'supporting_memory_ids', [])):
            links.append({"source": i.id, "target": str(m_id)})
            
    return {"nodes": nodes, "links": links}
