import pytest
import json
from unittest.mock import MagicMock, patch

from memory.domain.memory import Memory, MemoryType, MemoryStatus
from insight.domain.insight import InsightType
from insight.domain.candidate import InsightCandidate
from insight.services.insight_validation_service import InsightValidationService, ValidationError

@pytest.fixture
def service():
    # Patch the GenAI setup to avoid real API calls during init
    with patch("insight.services.insight_validation_service.genai"):
        return InsightValidationService()

@pytest.fixture
def candidate():
    return InsightCandidate(
        id="cand1",
        candidate_type=InsightType.TREND,
        title="Test Trend",
        description="A test trend candidate.",
        supporting_memory_ids=["m1", "m2"],
        candidate_score=0.9,
        generated_at="2026-07-16T12:00:00Z"
    )

@pytest.fixture
def memories():
    return [
        Memory(id="m1", user_id="u1", memory_type=MemoryType.SEMANTIC, summary="Test", title="Test", created_at="2026-07-16T12:00:00Z", updated_at="2026-07-16T12:00:00Z"),
        Memory(id="m2", user_id="u1", memory_type=MemoryType.SEMANTIC, summary="Test 2", title="Test 2", created_at="2026-07-16T12:00:00Z", updated_at="2026-07-16T12:00:00Z")
    ]

class MockResponse:
    def __init__(self, text):
        self.text = text

def _mock_gemini_response(service, json_dict: dict):
    mock_response = MagicMock()
    mock_response.text = json.dumps(json_dict)
    service.model.generate_content = MagicMock(return_value=mock_response)

def test_valid_candidate_approved(service, candidate, memories):
    _mock_gemini_response(service, {
        "confidence": 0.85,
        "reasoning": "Strong evidence found.",
        "updated_title": "Validated Trend",
        "updated_description": "Validated description.",
        "supporting_memory_ids": ["m1", "m2"],
        "contradicting_memory_ids": []
    })
    
    result = service.validate_candidate(candidate, memories)
    assert result.approved is True
    assert result.confidence == 0.85
    assert result.updated_title == "Validated Trend"
    assert result.reasoning == "Strong evidence found."

def test_weak_evidence_rejected(service, candidate, memories):
    _mock_gemini_response(service, {
        "confidence": 0.40,
        "reasoning": "Not enough connection.",
        "updated_title": "Test Trend",
        "updated_description": "A test trend candidate.",
        "supporting_memory_ids": ["m1"],
        "contradicting_memory_ids": []
    })
    
    result = service.validate_candidate(candidate, memories)
    assert result.approved is False
    assert result.reasoning == "Rejected: Weak evidence."

def test_insufficient_evidence_held(service, candidate, memories):
    _mock_gemini_response(service, {
        "confidence": 0.60,
        "reasoning": "Plausible but needs more data.",
        "updated_title": "Test Trend",
        "updated_description": "A test trend candidate.",
        "supporting_memory_ids": ["m1", "m2"],
        "contradicting_memory_ids": []
    })
    
    result = service.validate_candidate(candidate, memories)
    assert result.approved is False
    assert result.reasoning == "Held: Needs more evidence."

def test_contradictory_memories_rejected(service, candidate, memories):
    _mock_gemini_response(service, {
        "confidence": 0.90,
        "reasoning": "Very confident but found contradiction.",
        "updated_title": "Test Trend",
        "updated_description": "A test trend candidate.",
        "supporting_memory_ids": ["m1"],
        "contradicting_memory_ids": ["m2"]
    })
    
    result = service.validate_candidate(candidate, memories)
    assert result.approved is False
    assert result.reasoning == "Rejected: Contradictory evidence detected."

def test_gemini_timeout(service, candidate, memories):
    service.model.generate_content = MagicMock(side_effect=Exception("Deadline Exceeded"))
    
    with pytest.raises(ValidationError) as exc_info:
        service.validate_candidate(candidate, memories)
    assert "LLM validation failed" in str(exc_info.value)

def test_gemini_malformed_response(service, candidate, memories):
    mock_response = MagicMock()
    mock_response.text = "This is not json."
    service.model.generate_content = MagicMock(return_value=mock_response)
    
    with pytest.raises(ValidationError) as exc_info:
        service.validate_candidate(candidate, memories)
    assert "LLM validation failed" in str(exc_info.value)
