"""
knowledge_object.py
===================
Domain models representing the final synthesized Knowledge Object.

Purpose:
Defines the Knowledge Object, which packages the summary, entity references,
observations, and metadata derived from a single Capture.

Expected Future PRs:
- Add logic for serializing into graph database formats if needed.
"""

from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from capture.domain.observation import Observation
from capture.domain.entity import Entity

class CaptureType(str, Enum):
    """The type of the source capture."""
    JOURNAL = "JOURNAL"
    VOICE_NOTE = "VOICE_NOTE"
    PDF = "PDF"
    EMAIL = "EMAIL"
    CALENDAR_EVENT = "CALENDAR_EVENT"

class Provenance(BaseModel):
    """
    Traceability metadata linking the Knowledge Object back to its source capture.
    """
    capture_id: str = Field(..., description="Unique identifier of the source capture.")
    capture_type: CaptureType = Field(..., description="Type of the source capture.")
    source_uri: str = Field(..., description="URI or reference to the raw capture data.")

class KnowledgeObject(BaseModel):
    """
    The complete package of extracted knowledge from a single capture.
    Acts as a graph patch to be applied to the user's World Model.
    """
    id: str = Field(..., description="Unique identifier for the knowledge object.")
    user_id: str = Field(..., description="The user to whom this knowledge belongs.")
    provenance: Provenance = Field(..., description="Traceability to the source capture.")
    summary: str = Field(..., description="AI-generated summary of the capture's knowledge payload.")
    entities: List[Entity] = Field(default_factory=list, description="Resolved entities referenced.")
    observations: List[Observation] = Field(default_factory=list, description="Extracted observations.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context or processing metadata.")
    created_at: str = Field(..., description="ISO-8601 timestamp of creation.")
