"""
entity.py
=========
Domain models representing Canonical Entities in the Second Brain.

Purpose:
Defines the structure of an Entity, which represents a recognized, real-world
concept (e.g., Person, Project, Company) discovered from raw captures.

Expected Future PRs:
- Add relationship references directly if needed by graph structure.
- Add history tracking for entity merges.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class EntityType(str, Enum):
    """The category or type of the canonical entity."""
    PERSON = "PERSON"
    PROJECT = "PROJECT"
    TECHNOLOGY = "TECHNOLOGY"
    COMPANY = "COMPANY"
    BOOK = "BOOK"
    SKILL = "SKILL"
    PLACE = "PLACE"
    CONCEPT = "CONCEPT"
    UNKNOWN = "UNKNOWN"

class Entity(BaseModel):
    """
    A canonical entity recognized in the user's world model.
    """
    id: str = Field(..., description="Unique canonical identifier for the entity.")
    name: str = Field(..., description="Primary display name of the entity.")
    entity_type: EntityType = Field(..., description="The category of the entity.")
    aliases: List[str] = Field(default_factory=list, description="Other names this entity is known by.")
    user_id: str = Field(..., description="The user to whom this entity belongs.")
    created_at: str = Field(..., description="ISO-8601 timestamp of first discovery.")
    updated_at: str = Field(..., description="ISO-8601 timestamp of last modification.")
