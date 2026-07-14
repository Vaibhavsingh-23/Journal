"""
observation.py
==============
Domain models representing Observations extracted from captures.

Purpose:
Defines the Observation, which is the fundamental unit of extracted knowledge.
An observation replaces the previous 'Fact' concept, carrying perspective and
acting as a semantic triple linking entities or defining state.

Expected Future PRs:
- Add specific fields for Subject, Predicate, Object structures if needed.
- Support validation logic for specific Observation Types.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ObservationType(str, Enum):
    """The type of the observation."""
    STATE = "STATE"
    ACTION = "ACTION"
    RELATIONSHIP = "RELATIONSHIP"
    EMOTION = "EMOTION"
    GOAL = "GOAL"
    DECISION = "DECISION"
    EVENT = "EVENT"

class Perspective(str, Enum):
    """The perspective or source from which the observation is made."""
    EXPLICIT = "EXPLICIT"  # The user explicitly stated this
    INFERRED = "INFERRED"  # The AI deduced this from reading between the lines
    EXTERNAL = "EXTERNAL"  # Derived from an integration (e.g., Git, Calendar)

class Confidence(str, Enum):
    """Level of AI certainty regarding the observation extraction."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Observation(BaseModel):
    """
    An extracted, fundamental unit of knowledge.
    Acts as a semantic claim linking entities or describing a state.
    """
    id: str = Field(..., description="Unique identifier for the observation.")
    type: ObservationType = Field(..., description="The type/category of the observation.")
    perspective: Perspective = Field(..., description="The perspective of the observation.")
    description: str = Field(..., description="Human-readable description of the observation.")
    confidence: Confidence = Field(..., description="AI confidence level.")
    timestamp: str = Field(..., description="ISO-8601 timestamp of when the observation occurred.")
