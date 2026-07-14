"""
memory_formation_engine.py
==========================
Service for forming, attaching, and evolving Memories from MemoryFragments.

Follows the strict lifecycle:
1. Candidate Discovery
2. Candidate Ranking
3. LLM Story Evaluation
4. Decision & Execution
"""

import os
import json
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

import google.genai as genai
from google.genai import types as genai_types

from memory.domain.memory import Memory, MemoryFragment, MemoryStatus, MemoryType
from memory.repositories.memory_repository import MemoryRepository
from memory.repositories.memory_fragment_repository import MemoryFragmentRepository

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Structured LLM Output Schema
# ---------------------------------------------------------------------------
class LLMEvaluationResult(BaseModel):
    attach: bool = Field(..., description="Should this fragment continue this story?")
    confidence: float = Field(..., description="Confidence from 0.0 to 1.0.")
    reasoning: str = Field(..., description="Brief reasoning for this decision.")
    title: Optional[str] = Field(None, description="Suggested Memory title (only if creating a new Memory).")
    updated_summary: Optional[str] = Field(None, description="Updated Story Summary (if attaching).")

class FormationError(Exception):
    pass

# ---------------------------------------------------------------------------
# Memory Formation Engine
# ---------------------------------------------------------------------------
class MemoryFormationEngine:
    def __init__(
        self,
        memory_repository: MemoryRepository,
        fragment_repository: MemoryFragmentRepository,
        confidence_threshold: float = 0.75
    ):
        self.memory_repo = memory_repository
        self.fragment_repo = fragment_repository
        self.confidence_threshold = confidence_threshold
        
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model_name = "gemini-2.5-flash"

    def process_fragment(self, fragment: MemoryFragment) -> None:
        """
        Main entry point for memory formation.
        Persists the fragment, runs the evaluation pipeline, and creates/updates Memories.
        """
        logger.info(f"Processing fragment {fragment.id} for user {fragment.user_id}")
        
        # Ensure fragment is persisted exactly once first.
        # If it fails, we surface the error. It's safe since it's immutable.
        try:
            self.fragment_repo.save(fragment)
        except Exception as e:
            # If DuplicateKeyError, it means it's already saved. We can skip or proceed.
            # Assuming we want to proceed with formation if it failed mid-way previously.
            pass

        try:
            # 1. Candidate Discovery
            candidates = self._discover_candidates(fragment)
            
            # 2. Candidate Ranking
            ranked_candidates = self._rank_candidates(fragment, candidates)
            
            # 3. LLM Story Evaluation
            attachments = []
            for candidate in ranked_candidates:
                eval_result = self._evaluate_candidate(fragment, candidate)
                if eval_result.attach and eval_result.confidence >= self.confidence_threshold:
                    attachments.append((candidate, eval_result))
            
            # 4. Decision
            if attachments:
                for memory, eval_result in attachments:
                    self._attach_to_memory(fragment, memory, eval_result)
            else:
                self._create_new_memory(fragment)
                
        except Exception as e:
            logger.error(f"Memory formation failed for fragment {fragment.id}: {e}")
            # Do not lose the MemoryFragment (already persisted)
            # Mark it implicitly as unassigned (not linked to any Memory)
            # Future workers could retry orphaned fragments
            raise FormationError(f"Memory formation failed: {e}")

    # --- Pipeline Stages ---

    def _discover_candidates(self, fragment: MemoryFragment) -> List[Memory]:
        """
        Stage 1: Find candidate memories via MongoDB constraints.
        Must be deterministic.
        """
        # We query the repository for active memories belonging to the user.
        # Since the interface might not expose a direct shared-entities query,
        # we can fetch active memories and filter locally, or use a specific repository method.
        # Let's use `find_active` and filter by shared entities for simplicity, 
        # mimicking a fast deterministic query.
        active_memories = self.memory_repo.find_active(fragment.user_id)
        
        candidates = []
        fragment_entities = set(fragment.entity_ids)
        
        for mem in active_memories:
            # Shared entities check
            shared = fragment_entities.intersection(set(mem.entity_ids))
            if shared or not fragment_entities:
                # If there are shared entities, or the fragment has no entities, it's a candidate
                # (For fragments with no entities, we might rely on recency or just evaluate the most recent).
                candidates.append(mem)
                
        return candidates[:10]  # Limit to 10 as specified

    def _rank_candidates(self, fragment: MemoryFragment, candidates: List[Memory]) -> List[Memory]:
        """
        Stage 2: Rank candidates deterministically without Gemini.
        """
        def score_memory(mem: Memory) -> int:
            score = 0
            # Shared entities
            shared_entities = set(mem.entity_ids).intersection(set(fragment.entity_ids))
            score += len(shared_entities) * 10
            
            # Number of shared fragments
            score += min(len(mem.fragment_ids), 10) # Give some weight to established memories
            
            # Recency
            # Assuming created_at/updated_at are ISO formats sortable as strings
            if mem.updated_at > fragment.created_at[:10]: # Rough date match
                score += 5
                
            return score

        ranked = sorted(candidates, key=score_memory, reverse=True)
        # Limit the evaluated candidates to avoid exploding LLM calls
        return ranked[:3] 

    def _evaluate_candidate(self, fragment: MemoryFragment, candidate: Memory) -> LLMEvaluationResult:
        """
        Stage 3: Use Gemini to evaluate if the fragment belongs to this story.
        """
        prompt = f"""
You are the Memory Evaluator Engine.
Does the new memory fragment continue the following evolving memory story?

NEW FRAGMENT:
{fragment.content}
Entities: {", ".join(fragment.entity_ids)}

EXISTING MEMORY STORY:
Title: {candidate.title}
Summary: {candidate.summary}
Timeline: {"; ".join(candidate.timeline[-3:])}

Answer ONLY in the requested JSON format.
If attaching, provide an updated summary that incorporates the new fragment seamlessly.
"""
        return self._call_gemini(prompt)

    def _evaluate_new_memory(self, fragment: MemoryFragment) -> LLMEvaluationResult:
        """
        Evaluate for creating a brand new memory. (Internal LLM helper).
        """
        prompt = f"""
You are the Memory Evaluator Engine.
A new memory fragment was observed that does not fit into any existing stories.
Create a new memory story title and summary for this isolated event.

NEW FRAGMENT:
{fragment.content}

Answer ONLY in the requested JSON format, with attach=true, confidence=1.0, and provide a title and summary.
"""
        return self._call_gemini(prompt)

    def _call_gemini(self, prompt: str) -> LLMEvaluationResult:
        if not self.client:
            raise RuntimeError("Gemini client not initialized (missing API key).")
            
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LLMEvaluationResult,
                temperature=0.1
            ),
        )
        
        if not response.text:
            raise ValueError("Empty response from Gemini")
            
        return LLMEvaluationResult(**json.loads(response.text))

    # --- Actions ---

    def _attach_to_memory(self, fragment: MemoryFragment, memory: Memory, eval_result: LLMEvaluationResult) -> None:
        """Attach fragment to existing memory and update."""
        memory.summary = eval_result.updated_summary or memory.summary
        memory.timeline.append(fragment.content)
        memory.fragment_ids.append(fragment.id)
        
        # Merge entities
        existing_entities = set(memory.entity_ids)
        existing_entities.update(fragment.entity_ids)
        memory.entity_ids = list(existing_entities)
        
        memory.updated_at = datetime.utcnow().isoformat() + "Z"
        
        self.memory_repo.update(memory)

    def _create_new_memory(self, fragment: MemoryFragment) -> None:
        """Create a new Emerging Memory from a fragment."""
        eval_result = self._evaluate_new_memory(fragment)
        
        new_memory = Memory(
            id=f"mem_{uuid.uuid4().hex}",
            user_id=fragment.user_id,
            memory_type=MemoryType.EPISODIC, # Default
            status=MemoryStatus.EMERGING,
            title=eval_result.title or "New Memory",
            summary=eval_result.updated_summary or fragment.content,
            timeline=[fragment.content],
            fragment_ids=[fragment.id],
            entity_ids=fragment.entity_ids,
            created_at=datetime.utcnow().isoformat() + "Z",
            updated_at=datetime.utcnow().isoformat() + "Z"
        )
        
        self.memory_repo.save(new_memory)
