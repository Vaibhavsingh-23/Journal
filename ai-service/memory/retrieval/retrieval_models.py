"""
retrieval_models.py
===================
Data models for the Memory Retrieval Engine pipeline.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from memory.domain.memory import Memory, MemoryType
from capture.domain.knowledge_object import KnowledgeObject
from memory.domain.memory import MemoryFragment

class QuestionAnalysis(BaseModel):
    """Stage 1 output: Structured analysis of the user's question."""
    intent: str = Field(..., description="The user's intent (e.g., LEARNING, REFLECTION, RECALL).")
    entities: List[str] = Field(default_factory=list, description="Extracted canonical entities.")
    temporal_constraints: str = Field(default="ALL", description="Temporal constraints like 'last week' or 'ALL'.")
    memory_types: List[MemoryType] = Field(default_factory=list, description="Target memory types.")
    keywords: List[str] = Field(default_factory=list, description="Keywords for overlapping search.")

class MemoryCandidate(BaseModel):
    """Stage 2 output: Discovered candidate memory."""
    memory: Memory = Field(..., description="The candidate memory object.")

class RankedMemory(BaseModel):
    """Stage 3 output: Ranked candidate memory."""
    memory: Memory = Field(..., description="The memory object.")
    score: int = Field(..., description="Deterministic ranking score.")

class RetrievedEvidence(BaseModel):
    """Stage 4 output: Evidence chain for a single Memory."""
    memory_id: str = Field(..., description="ID of the memory.")
    fragments: List[MemoryFragment] = Field(default_factory=list, description="Fragments forming this memory.")
    knowledge_objects: List[KnowledgeObject] = Field(default_factory=list, description="Underlying knowledge objects.")

class RetrievalContext(BaseModel):
    """Stage 5 output: The structured context passed to the final LLM."""
    memory_summaries: List[str] = Field(default_factory=list, description="Summaries of the retrieved memories.")
    recent_timeline: List[str] = Field(default_factory=list, description="Timeline of recent events from the memories.")
    important_entities: List[str] = Field(default_factory=list, description="Entities involved in this context.")
    supporting_observations: List[str] = Field(default_factory=list, description="Key observations from evidence.")
    evidence_references: List[str] = Field(default_factory=list, description="Source trace strings (e.g., capture URIs).")
    recent_supporting_captures: List[str] = Field(default_factory=list, description="IDs of recent supporting captures.")

class RetrievalError(BaseModel):
    """Structured error if retrieval fails."""
    message: str = Field(..., description="Error message.")
    stage: str = Field(..., description="Pipeline stage where the error occurred.")

class MemoryRetrievalResult(BaseModel):
    """Stage 6 final output: The structured response for the user."""
    answer: str = Field(..., description="The grounded answer from the LLM.")
    evidence: List[RetrievedEvidence] = Field(default_factory=list, description="Traceable evidence used for the answer.")
    status: str = Field(default="SUCCESS", description="SUCCESS, ERROR, or INSUFFICIENT_INFORMATION")
    error: Optional[RetrievalError] = Field(None, description="Detailed error if status is ERROR.")
