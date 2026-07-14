import pytest
from unittest.mock import MagicMock
import json

from memory.domain.memory import MemoryFragment, Memory, MemoryStatus, MemoryType
from memory.services.memory_formation_engine import MemoryFormationEngine, LLMEvaluationResult, FormationError
from memory.repositories.exceptions import DuplicateKeyError

# ---------------------------------------------------------------------------
# Fixtures & Data
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_memory_repo():
    return MagicMock()

@pytest.fixture
def mock_fragment_repo():
    return MagicMock()

@pytest.fixture
def engine(mock_memory_repo, mock_fragment_repo):
    e = MemoryFormationEngine(mock_memory_repo, mock_fragment_repo, confidence_threshold=0.75)
    e.client = MagicMock() # Mock Gemini
    return e

def create_mock_fragment(frag_id="frag_1", entities=None) -> MemoryFragment:
    return MemoryFragment(
        id=frag_id,
        user_id="usr_1",
        knowledge_object_id="ko_1",
        capture_id="cap_1",
        content="Test content",
        entity_ids=entities or [],
        created_at="2026-07-14T12:00:00Z"
    )

def create_mock_memory(mem_id="mem_1", entities=None) -> Memory:
    return Memory(
        id=mem_id,
        user_id="usr_1",
        memory_type=MemoryType.PROJECT,
        status=MemoryStatus.ACTIVE,
        title="Test Memory",
        summary="Test Summary",
        timeline=["Event 1"],
        fragment_ids=["old_frag"],
        entity_ids=entities or [],
        created_at="2026-01-01T12:00:00Z",
        updated_at="2026-07-13T12:00:00Z"
    )

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_new_memory_creation(engine):
    # Arrange
    frag = create_mock_fragment("frag_1")
    engine.memory_repo.find_active.return_value = [] # No candidates
    
    # Mock Gemini new memory evaluation
    eval_result = LLMEvaluationResult(
        attach=True, confidence=1.0, reasoning="New", title="Brand New", updated_summary="Brand New Summary"
    )
    mock_response = MagicMock()
    mock_response.text = eval_result.model_dump_json()
    engine.client.models.generate_content.return_value = mock_response

    # Act
    engine.process_fragment(frag)
    
    # Assert
    engine.fragment_repo.save.assert_called_once_with(frag)
    engine.memory_repo.save.assert_called_once()
    
    saved_mem = engine.memory_repo.save.call_args[0][0]
    assert saved_mem.title == "Brand New"
    assert saved_mem.status == MemoryStatus.EMERGING
    assert frag.id in saved_mem.fragment_ids

def test_attach_to_existing_memory(engine):
    frag = create_mock_fragment("frag_1", ["ent_rahul"])
    mem = create_mock_memory("mem_1", ["ent_rahul"])
    
    engine.memory_repo.find_active.return_value = [mem]
    
    eval_result = LLMEvaluationResult(
        attach=True, confidence=0.8, reasoning="Match", updated_summary="Updated"
    )
    mock_response = MagicMock()
    mock_response.text = eval_result.model_dump_json()
    engine.client.models.generate_content.return_value = mock_response
    
    engine.process_fragment(frag)
    
    engine.memory_repo.update.assert_called_once_with(mem)
    assert mem.summary == "Updated"
    assert frag.content in mem.timeline
    assert frag.id in mem.fragment_ids

def test_attach_to_multiple_memories(engine):
    frag = create_mock_fragment("frag_1", ["ent_rahul", "ent_amazon"])
    mem1 = create_mock_memory("mem_1", ["ent_rahul"])
    mem2 = create_mock_memory("mem_2", ["ent_amazon"])
    
    engine.memory_repo.find_active.return_value = [mem1, mem2]
    
    eval_result = LLMEvaluationResult(
        attach=True, confidence=0.9, reasoning="Match", updated_summary="Updated"
    )
    mock_response = MagicMock()
    mock_response.text = eval_result.model_dump_json()
    engine.client.models.generate_content.return_value = mock_response
    
    engine.process_fragment(frag)
    
    assert engine.memory_repo.update.call_count == 2

def test_gemini_failure_preserves_fragment(engine):
    frag = create_mock_fragment("frag_1")
    engine.memory_repo.find_active.return_value = []
    
    engine.client.models.generate_content.side_effect = Exception("API Down")
    
    with pytest.raises(FormationError):
        engine.process_fragment(frag)
        
    engine.fragment_repo.save.assert_called_once_with(frag)
    engine.memory_repo.save.assert_not_called()
    engine.memory_repo.update.assert_not_called()

def test_ranking_logic(engine):
    frag = create_mock_fragment("frag_1", ["ent_A", "ent_B"])
    
    # mem_low: shares 0 entities, 1 frag
    mem_low = create_mock_memory("mem_low", ["ent_X"])
    mem_low.fragment_ids = ["f1"]
    
    # mem_high: shares 2 entities, 5 frags
    mem_high = create_mock_memory("mem_high", ["ent_A", "ent_B"])
    mem_high.fragment_ids = ["f1", "f2", "f3", "f4", "f5"]
    
    candidates = [mem_low, mem_high]
    
    ranked = engine._rank_candidates(frag, candidates)
    
    assert ranked[0].id == "mem_high"
    assert ranked[1].id == "mem_low"

def test_deterministic_candidate_discovery(engine):
    frag = create_mock_fragment("frag_1", ["ent_A"])
    
    mem_match = create_mock_memory("mem_1", ["ent_A"])
    mem_no_match = create_mock_memory("mem_2", ["ent_X"])
    
    engine.memory_repo.find_active.return_value = [mem_match, mem_no_match]
    
    candidates = engine._discover_candidates(frag)
    
    assert len(candidates) == 1
    assert candidates[0].id == "mem_1"

def test_fragment_already_persisted(engine):
    frag = create_mock_fragment("frag_1")
    engine.fragment_repo.save.side_effect = DuplicateKeyError("Exists")
    engine.memory_repo.find_active.return_value = []
    
    eval_result = LLMEvaluationResult(
        attach=True, confidence=1.0, reasoning="New", title="New", updated_summary="Sum"
    )
    mock_response = MagicMock()
    mock_response.text = eval_result.model_dump_json()
    engine.client.models.generate_content.return_value = mock_response
    
    # Should not raise DuplicateKeyError, should proceed with formation
    engine.process_fragment(frag)
    
    engine.memory_repo.save.assert_called_once()
