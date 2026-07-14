import pytest
import mongomock
from pymongo import errors

from capture.repositories.knowledge_repository import (
    MongoKnowledgeRepository, 
    RepositoryError, 
    DuplicateKeyError,
    ConnectionError
)
from capture.domain.knowledge_object import KnowledgeObject, Provenance, CaptureType
from capture.versioning import SCHEMA_VERSION

# ---------------------------------------------------------------------------
# Test Data
# ---------------------------------------------------------------------------

def create_mock_knowledge_object(k_id="ko_1", c_id="cap_1") -> KnowledgeObject:
    return KnowledgeObject(
        id=k_id,
        user_id="usr_123",
        provenance=Provenance(
            capture_id=c_id,
            capture_type=CaptureType.JOURNAL,
            source_uri=f"capture://JOURNAL/{c_id}"
        ),
        summary="Test summary",
        entities=[],
        observations=[],
        metadata={},
        created_at="2026-07-14T10:00:00Z"
    )

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    return client.journaldb

@pytest.fixture
def repo(mock_db):
    return MongoKnowledgeRepository(mock_db)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_successful_save_and_retrieve_by_id(repo, mock_db):
    ko = create_mock_knowledge_object("ko_123", "cap_123")
    
    # Act
    repo.save(ko)
    
    # Assert
    retrieved = repo.get_by_id("ko_123")
    assert retrieved is not None
    assert retrieved.id == "ko_123"
    assert retrieved.provenance.capture_id == "cap_123"
    assert retrieved.summary == "Test summary"
    
    # Verify metadata was injected at DB layer
    raw_doc = mock_db.knowledge_objects.find_one({"id": "ko_123"})
    assert "_version_metadata" in raw_doc
    assert raw_doc["_version_metadata"]["schema_version"] == SCHEMA_VERSION

def test_prevent_duplicate_save(repo):
    ko1 = create_mock_knowledge_object("ko_1", "cap_same")
    ko2 = create_mock_knowledge_object("ko_2", "cap_same")
    
    repo.save(ko1)
    
    with pytest.raises(DuplicateKeyError):
        repo.save(ko2)

def test_retrieve_by_capture_id(repo):
    ko = create_mock_knowledge_object("ko_99", "cap_99")
    repo.save(ko)
    
    retrieved = repo.get_by_capture_id("cap_99")
    assert retrieved is not None
    assert retrieved.id == "ko_99"

def test_exists_check(repo):
    ko = create_mock_knowledge_object("ko_88", "cap_88")
    
    assert not repo.exists("cap_88")
    
    repo.save(ko)
    
    assert repo.exists("cap_88")

def test_successful_update(repo):
    ko = create_mock_knowledge_object("ko_update", "cap_update")
    repo.save(ko)
    
    # Modify object
    ko.summary = "Updated summary"
    
    # Act
    repo.update(ko)
    
    # Assert
    retrieved = repo.get_by_id("ko_update")
    assert retrieved.summary == "Updated summary"

def test_update_non_existent_throws_error(repo):
    ko = create_mock_knowledge_object("ko_missing", "cap_missing")
    
    with pytest.raises(RepositoryError) as excinfo:
        repo.update(ko)
    
    assert "not found" in str(excinfo.value)

def test_mongo_failure_handling(mock_db):
    repo = MongoKnowledgeRepository(mock_db)
    ko = create_mock_knowledge_object("ko_fail", "cap_fail")
    
    # Force a general pymongo error during save
    # mongomock doesn't easily let us mock insert_one failures without patching
    from unittest.mock import patch
    with patch.object(repo.collection, 'insert_one', side_effect=errors.ServerSelectionTimeoutError("Timeout")):
        with pytest.raises(RepositoryError) as excinfo:
            repo.save(ko)
        
        assert "Database error during save" in str(excinfo.value)
