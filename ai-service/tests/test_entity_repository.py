import pytest
import mongomock
from pymongo import errors

from capture.repositories.entity_repository import (
    MongoEntityRepository,
    RepositoryError,
    DuplicateKeyError
)
from capture.domain.entity import Entity, EntityType

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    return client.journaldb

@pytest.fixture
def repo(mock_db):
    return MongoEntityRepository(mock_db)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def create_mock_entity(e_id="ent_1", name="rahul", u_id="usr_1") -> Entity:
    return Entity(
        id=e_id,
        name=name,
        entity_type=EntityType.PERSON,
        aliases=["Rahul"],
        user_id=u_id,
        created_at="2026-07-14T10:00:00Z",
        updated_at="2026-07-14T10:00:00Z"
    )

def test_successful_save_and_retrieve(repo):
    e = create_mock_entity("ent_1", "rahul", "usr_1")
    repo.save(e)
    
    # Retrieve by ID
    retrieved = repo.get_by_id("ent_1")
    assert retrieved is not None
    assert retrieved.name == "rahul"

    # Retrieve by Name
    retrieved_by_name = repo.find_by_name("rahul", "usr_1")
    assert retrieved_by_name is not None
    assert retrieved_by_name.id == "ent_1"

def test_prevent_duplicate_save(repo):
    e1 = create_mock_entity("ent_1", "rahul", "usr_1")
    e2 = create_mock_entity("ent_2", "rahul", "usr_1")  # Same name, same user
    
    repo.save(e1)
    
    with pytest.raises(DuplicateKeyError):
        repo.save(e2)

def test_multiple_users_identical_names(repo):
    # Valid: Two different users can have an entity named "rahul"
    e_user1 = create_mock_entity("ent_1", "rahul", "usr_1")
    e_user2 = create_mock_entity("ent_2", "rahul", "usr_2")
    
    repo.save(e_user1)
    repo.save(e_user2)  # Should not raise exception
    
    assert repo.exists("rahul", "usr_1")
    assert repo.exists("rahul", "usr_2")
    
def test_update_entity(repo):
    e = create_mock_entity("ent_1", "rahul", "usr_1")
    repo.save(e)
    
    e.aliases.append("Rahul Bhai")
    repo.update(e)
    
    retrieved = repo.get_by_id("ent_1")
    assert "Rahul Bhai" in retrieved.aliases
