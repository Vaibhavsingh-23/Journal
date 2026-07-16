"""
retrieval_gateway.py
====================
The Retrieval Gateway is the single public entry point for knowledge retrieval.
It enforces the Memory First Policy, orchestrating the transition from Memory Retrieval
to Document RAG fallback.
"""

import logging
from typing import Dict, Any

from memory.retrieval.memory_retrieval_engine import MemoryRetrievalEngine
from services.rag_service import ask_journal

logger = logging.getLogger(__name__)

class RetrievalGateway:
    """
    Orchestrates the retrieval strategy.
    Tries Memory Retrieval first, falls back to Document RAG if memory is empty or fails.
    """

    def __init__(self, memory_engine: MemoryRetrievalEngine):
        self.memory_engine = memory_engine

    def answer_question(self, user_id: str, question: str) -> Dict[str, Any]:
        """
        Answers a user's question, preferring Memory Retrieval with a fallback to RAG.
        Returns a dict matching the legacy API contract: {"answer": str, "sources": list[str]}.
        """
        logger.info(f"RetrievalGateway received question for user {user_id}: '{question}'")
        
        # 1. Attempt Memory Retrieval
        try:
            logger.info("RetrievalGateway: Attempting Memory Retrieval...")
            mem_result = self.memory_engine.retrieve_answer(user_id, question)
            
            # Check if Memory Retrieval found sufficient evidence
            # MemoryRetrievalEngine returns "SUCCESS" and empty evidence if no memories exist
            if mem_result.status == "SUCCESS" and len(mem_result.evidence) > 0:
                # Also check if it returned a generic failure message
                if "insufficient information" not in mem_result.answer.lower():
                    logger.info("RetrievalGateway: Memory Retrieval succeeded. Engine Used: MEMORY")
                    
                    # Map to API contract
                    sources = []
                    for ev in mem_result.evidence:
                        # Extract origin captures as sources
                        for ko in ev.knowledge_objects:
                            if ko.provenance.capture_id not in sources:
                                sources.append(ko.provenance.capture_id)
                                
                    return {
                        "answer": mem_result.answer,
                        "sources": sources,
                        "engine": "MEMORY"
                    }
                    
            logger.info("RetrievalGateway: Memory Retrieval found no evidence or insufficient information.")
            
        except Exception as e:
            logger.error(f"RetrievalGateway: Memory Retrieval failed with exception: {e}. Falling back to RAG.")
            
        # 2. Fallback to Document RAG
        logger.info("RetrievalGateway: Invoking Document RAG fallback...")
        
        try:
            rag_result = ask_journal(question=question, user_id=user_id)
            logger.info("RetrievalGateway: Document RAG completed. Engine Used: RAG")
            
            # Preserve existing RAG result structure but annotate the engine
            if isinstance(rag_result, dict):
                rag_result["engine"] = "RAG"
            return rag_result
            
        except Exception as e:
            logger.error(f"RetrievalGateway: Document RAG also failed: {e}")
            return {
                "answer": "An error occurred while retrieving information.",
                "sources": [],
                "error": str(e),
                "engine": "ERROR"
            }
