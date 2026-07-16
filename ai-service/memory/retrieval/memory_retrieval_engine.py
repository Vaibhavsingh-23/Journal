"""
memory_retrieval_engine.py
==========================
Orchestrator for the Memory Retrieval Pipeline.
Coordinates Stages 1-6 deterministically.
"""

import os
import logging
from typing import List

import google.genai as genai
from google.genai import types as genai_types

from memory.repositories.memory_repository import MemoryRepository
from memory.repositories.memory_fragment_repository import MemoryFragmentRepository
from capture.repositories.knowledge_repository import KnowledgeRepository

from memory.retrieval.retrieval_models import (
    MemoryRetrievalResult, RetrievedEvidence, RetrievalError
)
from memory.retrieval.question_analysis_service import QuestionAnalysisService
from memory.retrieval.memory_ranker import MemoryRanker
from memory.retrieval.context_builder import ContextBuilder

logger = logging.getLogger(__name__)

class MemoryRetrievalEngine:
    """Orchestrates the Memory Retrieval Pipeline."""

    def __init__(
        self,
        memory_repo: MemoryRepository,
        fragment_repo: MemoryFragmentRepository,
        knowledge_repo: KnowledgeRepository,
        question_analyzer: QuestionAnalysisService,
        ranker: MemoryRanker,
        context_builder: ContextBuilder
    ):
        self.memory_repo = memory_repo
        self.fragment_repo = fragment_repo
        self.knowledge_repo = knowledge_repo
        
        self.question_analyzer = question_analyzer
        self.ranker = ranker
        self.context_builder = context_builder

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model_name = "gemini-1.5-flash"  # Standard RAG inference model

    def retrieve_answer(self, user_id: str, question: str) -> MemoryRetrievalResult:
        """
        Executes the full retrieval pipeline strictly ordered:
        1. Question Analysis
        2. Memory Candidate Discovery
        3. Memory Ranking
        4. Evidence Retrieval
        5. Context Assembly
        6. LLM Reasoning
        """
        logger.info(f"Starting memory retrieval for user {user_id}. Question: '{question}'")
        
        try:
            # Stage 1: Question Analysis
            analysis = self.question_analyzer.analyze(question)
            
            # Stage 2: Memory Candidate Discovery
            candidates = self._discover_candidates(user_id, analysis)
            if not candidates:
                logger.info("No memory candidates found.")
                return MemoryRetrievalResult(
                    answer="There is no relevant memory or information to answer this question.",
                    evidence=[],
                    status="SUCCESS"
                )
            
            # Stage 3: Memory Ranking
            ranked_memories = self.ranker.rank(candidates, analysis)
            
            # Stage 4: Evidence Retrieval
            # Only retrieve evidence for the top ranked memories to save time/context
            top_ranked = ranked_memories[:3]
            evidence_chain = self._retrieve_evidence(top_ranked)
            
            # Stage 5: Context Assembly
            context = self.context_builder.build_context(top_ranked, evidence_chain)
            
            # Stage 6: LLM Reasoning
            answer = self._llm_reasoning(question, context)
            
            return MemoryRetrievalResult(
                answer=answer,
                evidence=evidence_chain,
                status="SUCCESS"
            )
            
        except Exception as e:
            logger.error(f"Retrieval Engine failed: {e}", exc_info=True)
            return MemoryRetrievalResult(
                answer="An error occurred while retrieving your memories.",
                evidence=[],
                status="ERROR",
                error=RetrievalError(message=str(e), stage="Unknown")
            )

    def _discover_candidates(self, user_id: str, analysis) -> List:
        """
        Stage 2: Deterministic candidate retrieval via MongoDB.
        """
        # We start by grabbing active memories for the user
        active_memories = self.memory_repo.find_active(user_id)
        
        candidates = []
        target_entities = set(analysis.entities)
        
        for mem in active_memories:
            # Filter by memory types if specified
            if analysis.memory_types and mem.memory_type not in analysis.memory_types:
                continue
                
            # Filter by entities (or just take all active if no specific entities extracted)
            if not target_entities or target_entities.intersection(set(mem.entity_ids)):
                candidates.append(mem)
                
        return candidates[:10]  # Hard limit 10 candidates

    def _retrieve_evidence(self, ranked_memories) -> List[RetrievedEvidence]:
        """
        Stage 4: Trace provenance deterministically. Memory -> Fragments -> KOs.
        """
        evidence_chain = []
        for rm in ranked_memories:
            mem = rm.memory
            evidence = RetrievedEvidence(memory_id=mem.id, fragments=[], knowledge_objects=[])
            
            # Fetch fragments
            for frag_id in mem.fragment_ids:
                frag = self.fragment_repo.get_by_id(frag_id)
                if frag:
                    evidence.fragments.append(frag)
                    
                    # Fetch Knowledge Object via capture_id or knowledge_object_id
                    ko = self.knowledge_repo.get_by_id(frag.knowledge_object_id)
                    if ko:
                        evidence.knowledge_objects.append(ko)
                        
            evidence_chain.append(evidence)
        return evidence_chain

    def _llm_reasoning(self, question: str, context) -> str:
        """
        Stage 6: Final LLM generation based strictly on Context.
        """
        if not self.client:
            return "Simulated Answer based on Context."
            
        context_str = "\n\n".join(context.memory_summaries)
        timeline_str = "\n".join(context.recent_timeline)
        obs_str = "\n".join(context.supporting_observations)
        
        prompt = f"""
You are the Memory Reasoning Engine.
Answer the user's question based strictly on the provided retrieved Memory Context.
Never hallucinate. Every claim must be grounded in the context.
If evidence is insufficient to fully answer, state that there is insufficient information.

RETRIEVED CONTEXT:
---
Memories:
{context_str}

Recent Timeline:
{timeline_str}

Key Observations:
{obs_str}
---

QUESTION: {question}
ANSWER:
"""
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.3
            ),
        )
        return response.text or "Insufficient information."
