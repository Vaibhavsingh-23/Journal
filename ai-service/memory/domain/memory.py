"""
memory.py
=========
Core domain models for the Memory Engine.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class MemoryType(str, Enum):
    """Categorization of the nature of the Memory."""
    EPISODIC = "EPISODIC"       
    SEMANTIC = "SEMANTIC"       
    RELATIONAL = "RELATIONAL"   
    PROJECT = "PROJECT"         
    GOAL = "GOAL"               

class MemoryStatus(str, Enum):
    """The lifecycle state of a Memory."""
    EMERGING = "EMERGING"         # Just formed, still solidifying
    ACTIVE = "ACTIVE"             # Currently relevant and frequently updated
    ARCHIVED = "ARCHIVED"         # Historical, no longer actively updated
    CONSOLIDATED = "CONSOLIDATED" # Merged or grouped into a higher-order memory

class MemoryFragment(BaseModel):
    """An immutable piece of experience derived from a single Capture/KnowledgeObject."""
    id: str = Field(..., description="Unique identifier for the fragment.")
    user_id: str = Field(..., description="The user to whom this fragment belongs.")
    knowledge_object_id: str = Field(..., description="ID of the source KnowledgeObject.")
    capture_id: str = Field(..., description="ID of the root Capture for traceability.")
    content: str = Field(..., description="The synthesized narrative or payload of this fragment.")
    entity_ids: List[str] = Field(default_factory=list, description="Canonical Entity IDs involved in this fragment.")
    created_at: str = Field(..., description="ISO-8601 timestamp of creation. Immutable.")

class Memory(BaseModel):
    """A higher-level, evolving understanding composed of multiple MemoryFragments."""
    id: str = Field(..., description="Unique identifier for the memory.")
    user_id: str = Field(..., description="The user to whom this memory belongs.")
    memory_type: MemoryType = Field(..., description="The categorization of the memory.")
    status: MemoryStatus = Field(default=MemoryStatus.EMERGING, description="Current lifecycle status.")
    
    title: str = Field(default="", description="The evolving title of the memory story.")
    summary: str = Field(..., description="The evolving AI-generated summary of the combined fragments.")
    timeline: List[str] = Field(default_factory=list, description="List of chronologically ordered summary points.")
    
    fragment_ids: List[str] = Field(default_factory=list, description="IDs of all immutable MemoryFragments composing this memory.")
    entity_ids: List[str] = Field(default_factory=list, description="Canonical Entity IDs heavily involved in this memory.")
    
    created_at: str = Field(..., description="ISO-8601 timestamp of when the memory was first formed.")
    updated_at: str = Field(..., description="ISO-8601 timestamp of last mutation (e.g., fragment added).")
