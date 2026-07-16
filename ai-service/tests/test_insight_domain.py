import pytest
from pydantic import ValidationError

from insight.domain.insight import (
    Insight, InsightEvidence, InsightStatus, InsightType, InsightConfidence
)

def test_insight_evidence_immutability():
    """Verify that InsightEvidence is immutable (frozen)."""
    evidence = InsightEvidence(
        memory_id="mem1",
        fragment_id="frag1",
        knowledge_object_id="ko1",
        capture_id="cap1",
        confidence=InsightConfidence.HIGH,
        reason="Provides strong baseline."
    )
    
    with pytest.raises(ValidationError) as exc_info:
        evidence.confidence = InsightConfidence.LOW
    
    assert "Instance is frozen" in str(exc_info.value)

def test_insight_valid_creation():
    """Verify that an Insight can be properly constructed and defaults are assigned."""
    insight = Insight(
        id="ins1",
        user_id="u1",
        title="Late Night Coding",
        description="User frequently codes past midnight.",
        type=InsightType.HABIT,
        confidence=InsightConfidence.MEDIUM,
        created_at="2026-07-16T12:00:00Z",
        updated_at="2026-07-16T12:00:00Z"
    )
    
    # Defaults
    assert insight.status == InsightStatus.CANDIDATE
    assert insight.importance == 1
    assert insight.version == 1
    assert insight.supporting_memory_ids == []
    assert insight.evidence == []

def test_insight_validation_errors():
    """Verify enum bounds and required fields."""
    # Missing required fields
    with pytest.raises(ValidationError):
        Insight(
            id="ins1",
            user_id="u1"
            # Missing title, description, etc.
        )
        
    # Invalid Enum
    with pytest.raises(ValidationError):
        Insight(
            id="ins1",
            user_id="u1",
            title="Late Night Coding",
            description="User frequently codes past midnight.",
            type="INVALID_TYPE", # Invalid
            confidence=InsightConfidence.MEDIUM,
            created_at="2026-07-16T12:00:00Z",
            updated_at="2026-07-16T12:00:00Z"
        )
        
    # Importance out of bounds
    with pytest.raises(ValidationError):
        Insight(
            id="ins1",
            user_id="u1",
            title="Late Night Coding",
            description="User frequently codes past midnight.",
            type=InsightType.HABIT,
            confidence=InsightConfidence.MEDIUM,
            importance=15, # > 10
            created_at="2026-07-16T12:00:00Z",
            updated_at="2026-07-16T12:00:00Z"
        )

def test_insight_mutability():
    """Verify that Insight itself is mutable (e.g. status changes)."""
    insight = Insight(
        id="ins1",
        user_id="u1",
        title="Late Night Coding",
        description="User frequently codes past midnight.",
        type=InsightType.HABIT,
        confidence=InsightConfidence.MEDIUM,
        created_at="2026-07-16T12:00:00Z",
        updated_at="2026-07-16T12:00:00Z"
    )
    
    # Mutate status
    insight.status = InsightStatus.ACTIVE
    insight.version += 1
    
    assert insight.status == InsightStatus.ACTIVE
    assert insight.version == 2
