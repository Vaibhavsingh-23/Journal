import pytest
from unittest.mock import MagicMock

from capture.capture_pipeline import CapturePipeline, Capture, ResolutionError
from capture.domain.knowledge_object import KnowledgeObject, CaptureType, Provenance
from capture.services.extraction_service import ExtractionError
from capture.repositories.knowledge_repository import RepositoryError, DuplicateKeyError

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_extraction_service():
    return MagicMock()

@pytest.fixture
def mock_resolution_service():
    return MagicMock()

@pytest.fixture
def mock_knowledge_repository():
    return MagicMock()

@pytest.fixture
def pipeline(mock_extraction_service, mock_resolution_service, mock_knowledge_repository):
    return CapturePipeline(
        extraction_service=mock_extraction_service,
        resolution_service=mock_resolution_service,
        knowledge_repository=mock_knowledge_repository
    )

def create_dummy_ko(capture_id="cap_1"):
    return KnowledgeObject(
        id=f"ko_{capture_id}",
        user_id="usr_1",
        provenance=Provenance(
            capture_id=capture_id,
            capture_type=CaptureType.JOURNAL,
            source_uri=f"capture://JOURNAL/{capture_id}"
        ),
        summary="Test",
        entities=[],
        observations=[],
        metadata={},
        created_at="2026-07-14T10:00:00Z"
    )

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_successful_pipeline_execution(pipeline):
    # Arrange
    cap = Capture(id="cap_1", text="Valid text", user_id="usr_1")
    unresolved_ko = create_dummy_ko("cap_1")
    resolved_ko = create_dummy_ko("cap_1")
    resolved_ko.summary = "Resolved summary"
    
    pipeline.extraction_service.extract.return_value = unresolved_ko
    pipeline.resolution_service.resolve.return_value = resolved_ko
    
    # Act
    result = pipeline.process_capture(cap)
    
    # Assert
    assert result.summary == "Resolved summary"
    
    # Verify execution order
    pipeline.extraction_service.extract.assert_called_once()
    pipeline.knowledge_repository.save.assert_called_once_with(unresolved_ko)
    pipeline.resolution_service.resolve.assert_called_once_with(unresolved_ko)
    pipeline.knowledge_repository.update.assert_called_once_with(resolved_ko)

def test_validation_failure(pipeline):
    # Arrange
    cap = Capture(id="cap_1", text="   ", user_id="usr_1") # Empty text
    
    # Act & Assert
    with pytest.raises(ValueError, match="Capture text cannot be empty"):
        pipeline.process_capture(cap)
        
    pipeline.extraction_service.extract.assert_not_called()
    pipeline.knowledge_repository.save.assert_not_called()

def test_extraction_failure(pipeline):
    # Arrange
    cap = Capture(id="cap_1", text="Valid text", user_id="usr_1")
    
    pipeline.extraction_service.extract.side_effect = ExtractionError("API failed")
    
    # Act & Assert
    with pytest.raises(ExtractionError):
        pipeline.process_capture(cap)
        
    pipeline.knowledge_repository.save.assert_not_called()

def test_persistence_failure_on_save(pipeline):
    # Arrange
    cap = Capture(id="cap_1", text="Valid text", user_id="usr_1")
    unresolved_ko = create_dummy_ko("cap_1")
    
    pipeline.extraction_service.extract.return_value = unresolved_ko
    pipeline.knowledge_repository.save.side_effect = DuplicateKeyError("Already exists")
    
    # Act & Assert
    with pytest.raises(DuplicateKeyError):
        pipeline.process_capture(cap)
        
    pipeline.resolution_service.resolve.assert_not_called()

def test_resolution_failure(pipeline):
    # Arrange
    cap = Capture(id="cap_1", text="Valid text", user_id="usr_1")
    unresolved_ko = create_dummy_ko("cap_1")
    
    pipeline.extraction_service.extract.return_value = unresolved_ko
    pipeline.resolution_service.resolve.side_effect = Exception("Resolution bug")
    
    # Act & Assert
    with pytest.raises(ResolutionError) as excinfo:
        pipeline.process_capture(cap)
        
    # Verify save WAS called before resolution
    pipeline.knowledge_repository.save.assert_called_once_with(unresolved_ko)
    
    # Verify update WAS NOT called
    pipeline.knowledge_repository.update.assert_not_called()
