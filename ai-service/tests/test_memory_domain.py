import pytest
from pydantic import ValidationError

from memory.domain.memory import (
    MemoryFragment,
    Memory,
    MemoryType,
    MemoryStatus
)

# ---------------------------------------------------------------------------
# Test MemoryFragment
# ---------------------------------------------------------------------------

def test_memory_fragment_creation():
    """Verify standard creation and required fields."""
    fragment = MemoryFragment(
        id="frag_1",
        user_id="usr_1",
        knowledge_object_id="ko_1",
        capture_id="cap_1",
        content="Rahul and I discussed the Second Brain.",
        entity_ids=["ent_rahul"],
        created_at="2026-07-14T12:00:00Z"
    )
    
    assert fragment.id == "frag_1"
    assert fragment.user_id == "usr_1"
    assert fragment.knowledge_object_id == "ko_1"
    assert fragment.capture_id == "cap_1"
    assert len(fragment.entity_ids) == 1
    
def test_memory_fragment_missing_fields():
    """Verify validation fails if required fields are missing."""
    with pytest.raises(ValidationError):
        MemoryFragment(
            id="frag_1",
            user_id="usr_1",
            # missing knowledge_object_id
            capture_id="cap_1",
            content="Missing fields",
            created_at="2026-07-14T12:00:00Z"
        )

# ---------------------------------------------------------------------------
# Test Memory
# ---------------------------------------------------------------------------

def test_memory_creation():
    """Verify memory creation and enum handling."""
    memory = Memory(
        id="mem_1",
        user_id="usr_1",
        memory_type=MemoryType.RELATIONAL,
        status=MemoryStatus.ACTIVE,
        summary="My relationship with Rahul revolves around engineering.",
        fragment_ids=["frag_1", "frag_2"],
        entity_ids=["ent_rahul"],
        created_at="2026-07-01T00:00:00Z",
        updated_at="2026-07-14T12:00:00Z"
    )
    
    assert memory.memory_type == MemoryType.RELATIONAL
    assert memory.status == MemoryStatus.ACTIVE
    assert memory.summary.startswith("My relationship")
    assert len(memory.fragment_ids) == 2

def test_memory_default_status():
    """Verify default status is ACTIVE if omitted."""
    memory = Memory(
        id="mem_1",
        user_id="usr_1",
        memory_type="PROJECT", # Allows string coercion
        summary="Building the second brain",
        created_at="2026-07-01T00:00:00Z",
        updated_at="2026-07-14T12:00:00Z"
    )
    
    assert memory.status == MemoryStatus.EMERGING
    assert memory.memory_type == MemoryType.PROJECT

def test_memory_invalid_enum():
    """Verify validation fails on invalid enum values."""
    with pytest.raises(ValidationError):
        Memory(
            id="mem_1",
            user_id="usr_1",
            memory_type="INVALID_TYPE", # Will fail
            summary="Invalid",
            created_at="2026-07-01T00:00:00Z",
            updated_at="2026-07-14T12:00:00Z"
        )

def test_serialization():
    """Verify dict/json serialization works for Pydantic models."""
    memory = Memory(
        id="mem_1",
        user_id="usr_1",
        memory_type=MemoryType.EPISODIC,
        summary="An episodic memory.",
        created_at="2026-07-01T00:00:00Z",
        updated_at="2026-07-14T12:00:00Z"
    )
    
    data = memory.model_dump()
    assert data["memory_type"] == "EPISODIC"
    assert data["status"] == "EMERGING"
    
    json_str = memory.model_dump_json()
    assert '"EPISODIC"' in json_str
