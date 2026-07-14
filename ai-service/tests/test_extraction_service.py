import pytest
from unittest.mock import MagicMock, patch
import json
from pydantic import ValidationError

from capture.services.extraction_service import ExtractionService, ExtractionError
from capture.domain.knowledge_object import CaptureType

# ---------------------------------------------------------------------------
# Test Data
# ---------------------------------------------------------------------------

VALID_GEMINI_RESPONSE = {
    "summary": "Meeting with Rahul to discuss Second Brain architecture.",
    "overall_confidence": "HIGH",
    "entities": [
        {"name": "Rahul", "entity_type": "PERSON", "confidence": "HIGH"},
        {"name": "Second Brain", "entity_type": "PROJECT", "confidence": "HIGH"},
        {"name": "Redis", "entity_type": "TECHNOLOGY", "confidence": "HIGH"}
    ],
    "observations": [
        {
            "type": "EVENT",
            "perspective": "EXPLICIT",
            "description": "Met Rahul to discuss Second Brain architecture.",
            "confidence": "HIGH"
        },
        {
            "type": "DECISION",
            "perspective": "EXPLICIT",
            "description": "Decided to learn Redis next week.",
            "confidence": "HIGH"
        },
        {
            "type": "EMOTION",
            "perspective": "EXPLICIT",
            "description": "Felt excited.",
            "confidence": "HIGH"
        }
    ]
}

INVALID_GEMINI_RESPONSE_MISSING_FIELDS = {
    "summary": "Meeting with Rahul.",
    # Missing overall_confidence
    "entities": [],
    "observations": []
}

INVALID_GEMINI_RESPONSE_INVALID_ENTITY = {
    "summary": "Meeting with Rahul.",
    "overall_confidence": "HIGH",
    "entities": [
        {"name": "Rahul", "entity_type": "INVALID_TYPE_BLAH", "confidence": "HIGH"}
    ],
    "observations": []
}

INVALID_GEMINI_RESPONSE_INVALID_OBSERVATION = {
    "summary": "Meeting with Rahul.",
    "overall_confidence": "HIGH",
    "entities": [],
    "observations": [
        {
            "type": "INVALID_OBS_TYPE",
            "perspective": "EXPLICIT",
            "description": "Met Rahul.",
            "confidence": "HIGH"
        }
    ]
}

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_genai_client():
    with patch('capture.services.extraction_service.genai.Client') as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        yield mock_client

@pytest.fixture
def extraction_service(mock_genai_client):
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'fake_key'}):
        return ExtractionService()

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_successful_extraction(extraction_service, mock_genai_client):
    # Arrange
    capture_text = "Today I met Rahul to discuss the Second Brain architecture. We decided to learn Redis next week. I felt excited."
    mock_response = MagicMock()
    mock_response.text = json.dumps(VALID_GEMINI_RESPONSE)
    mock_genai_client.models.generate_content.return_value = mock_response

    # Act
    ko = extraction_service.extract(
        capture_id="cap_123",
        capture_text=capture_text,
        user_id="user_1"
    )

    # Assert
    assert ko.summary == "Meeting with Rahul to discuss Second Brain architecture."
    assert len(ko.entities) == 3
    assert [e.name for e in ko.entities] == ["Rahul", "Second Brain", "Redis"]
    assert [e.entity_type.value for e in ko.entities] == ["PERSON", "PROJECT", "TECHNOLOGY"]
    
    assert len(ko.observations) == 3
    assert ko.observations[0].type.value == "EVENT"
    assert ko.observations[1].type.value == "DECISION"
    assert ko.observations[2].type.value == "EMOTION"
    
    assert ko.metadata["overall_confidence"] == "HIGH"
    assert ko.metadata["entity_confidences"]["entity_0_Rahul"] == "HIGH"
    assert ko.provenance.capture_id == "cap_123"

def test_malformed_response_triggers_retry(extraction_service, mock_genai_client):
    # Arrange
    # First response is malformed JSON, second is valid
    mock_response_bad = MagicMock()
    mock_response_bad.text = "{ malformed json "
    
    mock_response_good = MagicMock()
    mock_response_good.text = json.dumps(VALID_GEMINI_RESPONSE)
    
    mock_genai_client.models.generate_content.side_effect = [
        json.decoder.JSONDecodeError("Expecting value", "", 0),
        mock_response_good
    ]

    # Act
    ko = extraction_service.extract("cap_1", "Test text", "usr_1")

    # Assert
    assert ko is not None
    assert mock_genai_client.models.generate_content.call_count == 2

def test_validation_failure_missing_fields(extraction_service, mock_genai_client):
    # Arrange
    mock_response = MagicMock()
    mock_response.text = json.dumps(INVALID_GEMINI_RESPONSE_MISSING_FIELDS)
    
    # Both attempts return missing fields -> ValidationError
    mock_genai_client.models.generate_content.side_effect = [
        mock_response,
        mock_response
    ]

    # Act & Assert
    with pytest.raises(ExtractionError) as excinfo:
        extraction_service.extract("cap_1", "Test text", "usr_1")
    
    assert "Failed to extract knowledge" in str(excinfo.value)
    assert mock_genai_client.models.generate_content.call_count == 2

def test_validation_failure_invalid_entity(extraction_service, mock_genai_client):
    mock_response = MagicMock()
    mock_response.text = json.dumps(INVALID_GEMINI_RESPONSE_INVALID_ENTITY)
    
    mock_genai_client.models.generate_content.side_effect = [mock_response, mock_response]

    with pytest.raises(ExtractionError):
        extraction_service.extract("cap_1", "Test text", "usr_1")

def test_validation_failure_invalid_observation(extraction_service, mock_genai_client):
    mock_response = MagicMock()
    mock_response.text = json.dumps(INVALID_GEMINI_RESPONSE_INVALID_OBSERVATION)
    
    mock_genai_client.models.generate_content.side_effect = [mock_response, mock_response]

    with pytest.raises(ExtractionError):
        extraction_service.extract("cap_1", "Test text", "usr_1")

def test_timeout_handling(extraction_service, mock_genai_client):
    # Simulate a network timeout from Gemini
    from google.genai.errors import APIError
    
    mock_genai_client.models.generate_content.side_effect = Exception("Timeout Error")

    with pytest.raises(ExtractionError) as excinfo:
        extraction_service.extract("cap_1", "Test text", "usr_1")
    
    assert "Timeout Error" in str(excinfo.value.details.get("error", ""))
    assert mock_genai_client.models.generate_content.call_count == 2 # Attempt 1 + Retry

def test_empty_capture_text(extraction_service):
    with pytest.raises(ExtractionError) as excinfo:
        extraction_service.extract("cap_1", "   ", "usr_1")
    
    assert "Capture text cannot be empty" in str(excinfo.value)
