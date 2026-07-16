"""
candidate.py
============
Domain model for Insight Candidate generation.
A Candidate is an unvalidated pattern identified deterministically.
"""

from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from insight.domain.insight import InsightType

class CandidateStatus(str, Enum):
    NEW = "NEW"
    DISCARDED = "DISCARDED"
    READY_FOR_VALIDATION = "READY_FOR_VALIDATION"

class InsightCandidate(BaseModel):
    """
    Represents an unvalidated, deterministically grouped pattern of memories.
    """
    id: str = Field(..., description="Unique identifier for the candidate.")
    candidate_type: InsightType = Field(..., description="Type of pattern detected.")
    
    title: str = Field(..., description="Deterministic title describing the pattern.")
    description: str = Field(..., description="Explanation of why this candidate was formed.")
    
    supporting_memory_ids: List[str] = Field(default_factory=list, description="IDs of the grouped active memories.")
    affected_entity_ids: List[str] = Field(default_factory=list, description="The canonical entities linking these memories.")
    
    candidate_score: float = Field(..., description="Deterministic strength score [0.0 - 1.0].")
    
    pattern_metadata: Dict[str, Any] = Field(default_factory=dict, description="Heuristics used for generation.")
    
    status: CandidateStatus = Field(default=CandidateStatus.NEW, description="Lifecycle of the candidate.")
    generated_at: str = Field(..., description="ISO-8601 timestamp.")
