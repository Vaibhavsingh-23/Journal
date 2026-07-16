"""
insight.py
==========
Domain models for the Insight Engine.

An Insight is a validated inference derived from multiple Memories that reveals
a meaningful pattern not explicitly stated by the user.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class InsightStatus(str, Enum):
    """Lifecycle states of an Insight."""
    CANDIDATE = "CANDIDATE"
    VALIDATED = "VALIDATED"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    SUPERSEDED = "SUPERSEDED"

class InsightType(str, Enum):
    """Categorization of the Insight."""
    TREND = "TREND"
    HABIT = "HABIT"
    BEHAVIOUR = "BEHAVIOUR"
    EMOTIONAL = "EMOTIONAL"
    RELATIONSHIP = "RELATIONSHIP"
    GOAL_PROGRESS = "GOAL_PROGRESS"
    CONTRADICTION = "CONTRADICTION"
    OPPORTUNITY = "OPPORTUNITY"

class InsightDirection(str, Enum):
    """The trajectory or valence of the Insight."""
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"

class InsightConfidence(str, Enum):
    """Confidence level of the Insight."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class InsightEvidence(BaseModel):
    """
    Immutable evidence mapping back to the fundamental source structures.
    Preserves explainability down to the Original Capture.
    """
    model_config = ConfigDict(frozen=True)
    
    memory_id: str = Field(..., description="The ID of the Memory providing evidence.")
    fragment_id: str = Field(..., description="The ID of the specific Memory Fragment.")
    knowledge_object_id: str = Field(..., description="The ID of the underlying Knowledge Object.")
    capture_id: str = Field(..., description="The ID of the original source Capture.")
    confidence: InsightConfidence = Field(..., description="Confidence in this specific piece of evidence.")
    reason: str = Field(..., description="Why this evidence supports or contradicts the Insight.")

class Insight(BaseModel):
    """
    The core domain model for an Insight.
    Mutable, versioned, and tracks supporting/contradicting evidence.
    """
    id: str = Field(..., description="Unique identifier for the Insight.")
    user_id: str = Field(..., description="ID of the user this Insight belongs to.")
    
    title: str = Field(..., description="Short, descriptive title of the pattern.")
    description: str = Field(..., description="Detailed explanation of the validated inference.")
    
    type: InsightType = Field(..., description="Category of the Insight.")
    status: InsightStatus = Field(default=InsightStatus.CANDIDATE, description="Lifecycle status.")
    confidence: InsightConfidence = Field(..., description="Overall confidence level.")
    
    importance: int = Field(default=1, ge=1, le=10, description="Importance score from 1 to 10.")
    version: int = Field(default=1, ge=1, description="Version number for mutation tracking.")
    
    supporting_memory_ids: List[str] = Field(default_factory=list, description="Memories supporting this insight.")
    contradicting_memory_ids: List[str] = Field(default_factory=list, description="Memories contradicting this insight.")
    affected_entity_ids: List[str] = Field(default_factory=list, description="Canonical entity IDs involved.")
    
    evidence: List[InsightEvidence] = Field(default_factory=list, description="Detailed evidence chain.")
    
    created_at: str = Field(..., description="ISO-8601 timestamp of creation.")
    updated_at: str = Field(..., description="ISO-8601 timestamp of last update.")
