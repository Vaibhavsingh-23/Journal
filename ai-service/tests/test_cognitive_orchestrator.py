import pytest
from unittest.mock import MagicMock, patch

from orchestration.cognitive_orchestrator import CognitiveOrchestrator
from capture.services.extraction_service import ExtractionError
from insight.services.insight_validation_service import ValidationError

def test_cognitive_orchestrator_successful_flow():
    """Test the complete happy path of the cognitive orchestrator."""
    capture_pipeline = MagicMock()
    memory_engine = MagicMock()
    memory_repo = MagicMock()
    candidate_gen = MagicMock()
    insight_val = MagicMock()
    insight_con = MagicMock()

    orchestrator = CognitiveOrchestrator(
        capture_pipeline=capture_pipeline,
        memory_engine=memory_engine,
        memory_repo=memory_repo,
        candidate_gen=candidate_gen,
        insight_val=insight_val,
        insight_con=insight_con
    )

    # Mock Capture Pipeline
    ko_mock = MagicMock()
    ko_mock.id = "ko_123"
    capture_pipeline.process_capture.return_value = ko_mock

    # Mock Memory Engine
    memory_mock = MagicMock()
    memory_mock.id = "mem_123"
    memory_mock.pending_insight_generation = False
    memory_engine.process_knowledge_object.return_value = [memory_mock]

    # Mock Insight Engine dependencies
    memory_repo.find_by_user.return_value = [memory_mock]
    
    candidate_mock = MagicMock()
    candidate_mock.id = "cand_123"
    candidate_mock.supporting_memory_ids = ["mem_123"]
    candidate_gen.generate_candidates.return_value = [candidate_mock]
    
    validation_mock = MagicMock()
    validation_mock.approved = True
    insight_val.validate.return_value = validation_mock
    
    orchestrator.run_pipeline("entry_1", "Hello world", "user_1")

    # Assertions
    capture_pipeline.process_capture.assert_called_once()
    memory_engine.process_knowledge_object.assert_called_once_with(ko_mock)
    
    # Assert memory was saved and dirtied
    assert memory_mock.pending_insight_generation == False # Should be reset to false at end of pipeline!
    assert memory_repo.update.call_count == 2 # 1 for dirtying, 1 for clearing

    # Assert insight engine ran
    candidate_gen.generate_candidates.assert_called_once()
    insight_val.validate.assert_called_once_with(candidate_mock)
    insight_con.consolidate.assert_called_once()


def test_cognitive_orchestrator_isolation_insight_failure():
    """Test that a failure in the insight phase does not rollback the memory phase, but keeps it dirty."""
    capture_pipeline = MagicMock()
    memory_engine = MagicMock()
    memory_repo = MagicMock()
    candidate_gen = MagicMock()
    insight_val = MagicMock()
    insight_con = MagicMock()

    orchestrator = CognitiveOrchestrator(
        capture_pipeline=capture_pipeline,
        memory_engine=memory_engine,
        memory_repo=memory_repo,
        candidate_gen=candidate_gen,
        insight_val=insight_val,
        insight_con=insight_con
    )

    ko_mock = MagicMock()
    capture_pipeline.process_capture.return_value = ko_mock

    memory_mock = MagicMock()
    memory_mock.id = "mem_123"
    memory_mock.pending_insight_generation = False
    memory_engine.process_knowledge_object.return_value = [memory_mock]

    memory_repo.find_by_user.return_value = [memory_mock]
    
    candidate_mock = MagicMock()
    candidate_mock.supporting_memory_ids = ["mem_123"]
    candidate_gen.generate_candidates.return_value = [candidate_mock]
    
    # Simulate Insight LLM failure
    insight_val.validate.side_effect = ValidationError("Gemini timed out")
    
    orchestrator.run_pipeline("entry_1", "Hello world", "user_1")

    # Assertions
    capture_pipeline.process_capture.assert_called_once()
    memory_engine.process_knowledge_object.assert_called_once()
    
    # Memory should REMAIN DIRTY because the pipeline failed to clear it due to ValidationError
    # The first update is setting it to dirty. The second update should NOT happen.
    assert memory_repo.update.call_count == 1
