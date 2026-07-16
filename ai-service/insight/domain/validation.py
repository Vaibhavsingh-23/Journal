"""
validation.py
=============
Domain model for Insight Validation.
"""

from typing import List
from pydantic import BaseModel, Field

class InsightValidationResult(BaseModel):
    """
    The outcome of an LLM evaluating a deterministic InsightCandidate.
    """
    candidate_id: str = Field(..., description="The ID of the evaluated candidate.")
    
    approved: bool = Field(..., description="Whether the candidate crossed the validation threshold.")
    confidence: float = Field(..., description="The LLM-calculated semantic confidence [0.0 - 1.0].")
    reasoning: str = Field(..., description="Explanation for approval or rejection.")
    
    updated_title: str = Field(..., description="Human-readable title refined by the LLM.")
    updated_description: str = Field(..., description="Human-readable description refined by the LLM.")
    
    supporting_memories: List[str] = Field(default_factory=list, description="IDs of memories that actually support it.")
    contradicting_memories: List[str] = Field(default_factory=list, description="IDs of memories that explicitly contradict it.")
    
    validation_timestamp: str = Field(..., description="ISO-8601 timestamp.")
    validation_version: int = Field(default=1, description="Version of the validation prompt/engine used.")
