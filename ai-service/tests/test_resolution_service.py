import pytest
import mongomock

from capture.repositories.entity_repository import MongoEntityRepository
from capture.services.resolution_service import ResolutionService
from capture.domain.entity import Entity, EntityType
from capture.domain.knowledge_object import KnowledgeObject, Provenance, CaptureType

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    return client.journaldb

@pytest.fixture
def entity_repo(mock_db):
    return MongoEntityRepository(mock_db)

@pytest.fixture
def resolution_service(entity_repo):
    return ResolutionService(entity_repo)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def create_raw_knowledge_object(user_id: str, raw_entities: list[str]) -> KnowledgeObject:
    # Construct raw entity models (similar to extraction output)
    entities = []
    for name in raw_entities:
        entities.append(Entity(
            id="", 
            name=name, 
            entity_type=EntityType.PERSON,
            aliases=[],
            user_id=user_id,
            created_at="",
            updated_at=""
        ))
        
    return KnowledgeObject(
        id="ko_1",
        user_id=user_id,
        provenance=Provenance(
            capture_id="cap_1",
            capture_type=CaptureType.JOURNAL,
            source_uri="capture://JOURNAL/cap_1"
        ),
        summary="",
        entities=entities,
        observations=[],
        metadata={},
        created_at="2026-07-14T10:00:00Z"
    )

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_new_entity_creation(resolution_service, entity_repo):
    ko = create_raw_knowledge_object("usr_1", ["Rahul"])
    
    resolved_ko = resolution_service.resolve(ko)
    
    assert len(resolved_ko.entities) == 1
    canonical_entity = resolved_ko.entities[0]
    
    assert canonical_entity.id.startswith("ent_")
    assert canonical_entity.name == "rahul"  # Normalized lowercase
    assert "Rahul" in canonical_entity.aliases  # Alias preserved
    
    # DB persistence check
    assert entity_repo.exists("rahul", "usr_1")

def test_existing_entity_reuse(resolution_service, entity_repo):
    # First extraction
    ko1 = create_raw_knowledge_object("usr_1", ["Rahul"])
    resolution_service.resolve(ko1)
    
    # DB state: 1 entity
    assert entity_repo.collection.count_documents({}) == 1
    
    # Second extraction later
    ko2 = create_raw_knowledge_object("usr_1", ["rahul"])
    resolved_ko2 = resolution_service.resolve(ko2)
    
    assert len(resolved_ko2.entities) == 1
    # DB state: still 1 entity
    assert entity_repo.collection.count_documents({}) == 1
    
    # Should be the same canonical ID
    first_ent = entity_repo.find_by_name("rahul", "usr_1")
    assert resolved_ko2.entities[0].id == first_ent.id

def test_whitespace_and_case_normalization(resolution_service, entity_repo):
    ko1 = create_raw_knowledge_object("usr_1", ["  Rahul  "])
    ko2 = create_raw_knowledge_object("usr_1", ["RAHUL"])
    
    resolution_service.resolve(ko1)
    resolution_service.resolve(ko2)
    
    assert entity_repo.collection.count_documents({}) == 1
    ent = entity_repo.find_by_name("rahul", "usr_1")
    
    assert "  Rahul  " in ent.aliases
    assert "RAHUL" in ent.aliases
    assert ent.name == "rahul"

def test_multiple_users_isolation(resolution_service, entity_repo):
    ko_user1 = create_raw_knowledge_object("usr_1", ["Rahul"])
    ko_user2 = create_raw_knowledge_object("usr_2", ["Rahul"])
    
    resolution_service.resolve(ko_user1)
    resolution_service.resolve(ko_user2)
    
    assert entity_repo.collection.count_documents({}) == 2
    
    ent1 = entity_repo.find_by_name("rahul", "usr_1")
    ent2 = entity_repo.find_by_name("rahul", "usr_2")
    
    assert ent1 is not None
    assert ent2 is not None
    assert ent1.id != ent2.id
