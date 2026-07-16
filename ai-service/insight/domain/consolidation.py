"""
consolidation.py
================
Domain models for Insight Lifecycle Consolidation.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ConsolidationAction(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    MERGED = "MERGED"
    SUPERSEDED = "SUPERSEDED"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"

class InsightConsolidationResult(BaseModel):
    """Result of the consolidation engine's lifecycle decisions."""
    action: ConsolidationAction = Field(..., description="The primary action taken.")
    
    new_version: Optional[int] = Field(default=None, description="The resulting version number, if applicable.")
    
    affected_insight_ids: List[str] = Field(default_factory=list, description="IDs of Insights that were modified or created.")
    
    timestamp: str = Field(..., description="ISO-8601 timestamp.")
