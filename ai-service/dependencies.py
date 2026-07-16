"""
dependencies.py
===============
FastAPI dependencies for injecting services into routes.
"""

from fastapi import Request
from memory.retrieval.retrieval_gateway import RetrievalGateway

def get_retrieval_gateway(request: Request) -> RetrievalGateway:
    """Extracts the RetrievalGateway from the FastAPI app state."""
    gateway = getattr(request.app.state, "retrieval_gateway", None)
    if not gateway:
        raise RuntimeError("RetrievalGateway is not initialized in app.state")
    return gateway

def get_cognitive_orchestrator(request: Request):
    """Extracts the CognitiveOrchestrator from the FastAPI app state."""
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if not orchestrator:
        raise RuntimeError("CognitiveOrchestrator is not initialized in app.state")
    return orchestrator

def get_knowledge_repo(request: Request):
    return getattr(request.app.state, "knowledge_repo", None)

def get_memory_repo(request: Request):
    return getattr(request.app.state, "memory_repo", None)

def get_insight_repo(request: Request):
    return getattr(request.app.state, "insight_repo", None)
