import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone

from insight.domain.insight import Insight, InsightStatus, InsightEvidence, InsightType, InsightConfidence
from insight.domain.candidate import InsightCandidate, CandidateStatus
from insight.domain.validation import InsightValidationResult
from insight.domain.consolidation import ConsolidationAction, InsightConsolidationResult
from insight.services.insight_consolidation_service import InsightConsolidationService, ConsolidationError

@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.find_active.return_value = []
    return repo

@pytest.fixture
def service(mock_repo):
    return InsightConsolidationService(mock_repo)

@pytest.fixture
def candidate():
    return InsightCandidate(
        id="cand1",
        candidate_type=InsightType.TREND,
        title="Candidate Trend",
        description="A trend.",
        supporting_memory_ids=["m1", "m2"],
        affected_entity_ids=["e1", "e2"],
        candidate_score=0.9,
        status=CandidateStatus.READY_FOR_VALIDATION,
        generated_at="2026-07-16T12:00:00Z"
    )

@pytest.fixture
def validation():
    return InsightValidationResult(
        candidate_id="cand1",
        approved=True,
        confidence=0.85,
        reasoning="Validated.",
        updated_title="Validated Trend",
        updated_description="A validated trend.",
        supporting_memories=["m1", "m2"],
        contradicting_memories=[],
        validation_timestamp="2026-07-16T12:05:00Z"
    )

def test_rejected_validation_aborts(service, candidate, validation):
    validation.approved = False
    result = service.consolidate("u1", candidate, validation)
    assert result.action == ConsolidationAction.REJECTED
    service.repo.save.assert_not_called()
    service.repo.update.assert_not_called()

def test_create_new_insight(service, candidate, validation):
    service.repo.find_active.return_value = []
    
    result = service.consolidate("u1", candidate, validation)
    assert result.action == ConsolidationAction.CREATED
    assert result.new_version == 1
    assert len(result.affected_insight_ids) == 1
    
    service.repo.save.assert_called_once()
    saved_insight = service.repo.save.call_args[0][0]
    assert saved_insight.title == "Validated Trend"
    assert saved_insight.version == 1
    assert len(saved_insight.evidence) == 2

def test_update_existing_insight(service, candidate, validation, mock_repo):
    # Setup an existing equivalent insight
    existing = Insight(
        id="ins1",
        user_id="u1",
        status=InsightStatus.ACTIVE,
        type=InsightType.TREND,
        title="Old Trend",
        description="Old.",
        confidence=InsightConfidence.MEDIUM,
        importance=5,
        supporting_memory_ids=["m1"],
        evidence=[InsightEvidence(memory_id="m1", fragment_id="f1", knowledge_object_id="k1", capture_id="c1", confidence=InsightConfidence.MEDIUM, reason="old")],
        affected_entity_ids=["e1"],
        created_at="2026-07-01T12:00:00Z",
        updated_at="2026-07-01T12:00:00Z",
        version=1
    )
    mock_repo.find_active.return_value = [existing]
    
    result = service.consolidate("u1", candidate, validation)
    
    assert result.action == ConsolidationAction.UPDATED
    assert result.new_version == 2
    assert result.affected_insight_ids == ["ins1"]
    
    mock_repo.update.assert_called_once()
    updated_insight = mock_repo.update.call_args[0][0]
    assert updated_insight.version == 2
    assert updated_insight.confidence == InsightConfidence.HIGH
    assert len(updated_insight.evidence) == 2  # m1 was kept, m2 appended

def test_merge_duplicate_insights(service, candidate, validation, mock_repo):
    # Two existing overlapping insights
    existing1 = Insight(
        id="ins1",
        user_id="u1",
        status=InsightStatus.ACTIVE,
        type=InsightType.TREND,
        title="Old Trend 1",
        description="Old 1.",
        confidence=InsightConfidence.MEDIUM,
        importance=5,
        supporting_memory_ids=["m1"],
        evidence=[InsightEvidence(memory_id="m1", fragment_id="f1", knowledge_object_id="k1", capture_id="c1", confidence=InsightConfidence.MEDIUM, reason="old")],
        affected_entity_ids=["e1", "e2"],
        created_at="2026-07-01T12:00:00Z",
        updated_at="2026-07-01T12:00:00Z",
        version=1
    )
    existing2 = Insight(
        id="ins2",
        user_id="u1",
        status=InsightStatus.ACTIVE,
        type=InsightType.TREND,
        title="Old Trend 2",
        description="Old 2.",
        confidence=InsightConfidence.LOW,
        importance=5,
        supporting_memory_ids=["m2"],
        evidence=[InsightEvidence(memory_id="m2", fragment_id="f2", knowledge_object_id="k2", capture_id="c2", confidence=InsightConfidence.LOW, reason="old")],
        affected_entity_ids=["e1", "e2"],
        created_at="2026-07-01T12:00:00Z",
        updated_at="2026-07-01T12:00:00Z",
        version=1
    )
    mock_repo.find_active.return_value = [existing1, existing2]
    
    result = service.consolidate("u1", candidate, validation)
    assert result.action == ConsolidationAction.MERGED
    assert result.new_version == 2
    assert set(result.affected_insight_ids) == {"ins1", "ins2"}
    
    # Check that update was called for both
    assert mock_repo.update.call_count == 2
    
    # ins2 should be marked SUPERSEDED
    assert existing2.status == InsightStatus.SUPERSEDED
    assert existing1.status == InsightStatus.ACTIVE
    assert existing1.version == 2

def test_supersede_contradictory_insight(service, candidate, validation, mock_repo):
    # Setup candidate as a contradiction
    candidate.candidate_type = InsightType.CONTRADICTION
    validation.contradicting_memories = ["m3"]
    
    # Existing insight that used m3
    existing = Insight(
        id="ins1",
        user_id="u1",
        status=InsightStatus.ACTIVE,
        type=InsightType.HABIT, # Doesn't matter, we find it by memory ID overlap
        title="Old Habit",
        description="Old.",
        confidence=InsightConfidence.HIGH,
        importance=5,
        supporting_memory_ids=["m3"],
        evidence=[InsightEvidence(memory_id="m3", fragment_id="f3", knowledge_object_id="k3", capture_id="c3", confidence=InsightConfidence.HIGH, reason="old")],
        affected_entity_ids=["e1"],
        created_at="2026-07-01T12:00:00Z",
        updated_at="2026-07-01T12:00:00Z",
        version=1
    )
    mock_repo.find_active.return_value = [existing]
    
    result = service.consolidate("u1", candidate, validation)
    assert result.action == ConsolidationAction.SUPERSEDED
    
    # The old insight should be superseded
    assert existing.status == InsightStatus.SUPERSEDED
    mock_repo.update.assert_called_once_with(existing)
    
    # A new insight should be saved
    mock_repo.save.assert_called_once()
    saved_insight = mock_repo.save.call_args[0][0]
    assert saved_insight.type == InsightType.CONTRADICTION

def test_archive_obsolete(service, mock_repo):
    existing = Insight(
        id="ins1",
        user_id="u1",
        status=InsightStatus.ACTIVE,
        type=InsightType.HABIT,
        title="Old Habit",
        description="Old.",
        confidence=InsightConfidence.HIGH,
        importance=5,
        supporting_memory_ids=["m1"],
        evidence=[InsightEvidence(memory_id="m1", fragment_id="f1", knowledge_object_id="k1", capture_id="c1", confidence=InsightConfidence.HIGH, reason="old")],
        affected_entity_ids=["e1"],
        created_at="2026-07-01T12:00:00Z",
        updated_at="2026-07-01T12:00:00Z",
        version=1
    )
    mock_repo.find_active.return_value = [existing]
    
    # We pass in an empty list of active memories, meaning m1 is no longer active
    archived_ids = service.archive_obsolete("u1", active_memories=["m2", "m3"])
    
    assert archived_ids == ["ins1"]
    assert existing.status == InsightStatus.ARCHIVED
    mock_repo.update.assert_called_once_with(existing)

def test_failed_consolidation(service, candidate, validation, mock_repo):
    mock_repo.save.side_effect = Exception("DB Error")
    
    with pytest.raises(ConsolidationError):
        service.consolidate("u1", candidate, validation)
