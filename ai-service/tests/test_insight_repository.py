import pytest
import mongomock

from insight.domain.insight import Insight, InsightType, InsightStatus, InsightConfidence
from insight.repositories.insight_repository import (
    MongoInsightRepository, DuplicateKeyError, NotFoundError
)

@pytest.fixture
def mongo_client():
    return mongomock.MongoClient()

@pytest.fixture
def repo(mongo_client):
    db = mongo_client["test_db"]
    return MongoInsightRepository(db)

@pytest.fixture
def base_insight():
    return Insight(
        id="ins1",
        user_id="u1",
        title="Test Insight",
        description="A test insight",
        type=InsightType.HABIT,
        confidence=InsightConfidence.HIGH,
        created_at="2026-07-16T12:00:00Z",
        updated_at="2026-07-16T12:00:00Z",
        affected_entity_ids=["e1"]
    )

def test_save_and_retrieve(repo, base_insight):
    repo.save(base_insight)
    
    retrieved = repo.get_by_id("ins1")
    assert retrieved is not None
    assert retrieved.id == "ins1"
    assert retrieved.title == "Test Insight"
    assert retrieved.type == InsightType.HABIT
    
    # Verify metadata is injected natively
    raw_doc = repo.collection.find_one({"id": "ins1"})
    assert "_metadata" in raw_doc
    assert raw_doc["_metadata"]["schema_version"] == "1.0"
    
def test_save_duplicate(repo, base_insight):
    repo.save(base_insight)
    with pytest.raises(DuplicateKeyError):
        repo.save(base_insight)

def test_update_success(repo, base_insight):
    repo.save(base_insight)
    
    base_insight.status = InsightStatus.ACTIVE
    base_insight.version = 2
    repo.update(base_insight)
    
    updated = repo.get_by_id("ins1")
    assert updated.status == InsightStatus.ACTIVE
    assert updated.version == 2
    
def test_update_not_found(repo, base_insight):
    with pytest.raises(NotFoundError):
        repo.update(base_insight)

def test_find_active(repo, base_insight):
    repo.save(base_insight) # Defaults to CANDIDATE
    
    active_ins = Insight(
        id="ins2", user_id="u1", title="Active", description="Desc",
        type=InsightType.TREND, confidence=InsightConfidence.HIGH,
        created_at="2026", updated_at="2026",
        status=InsightStatus.ACTIVE
    )
    repo.save(active_ins)
    
    active_insights = repo.find_active("u1")
    assert len(active_insights) == 1
    assert active_insights[0].id == "ins2"

def test_find_by_type(repo, base_insight):
    repo.save(base_insight)
    insights = repo.find_by_type("u1", InsightType.HABIT)
    assert len(insights) == 1
    
    insights_empty = repo.find_by_type("u1", InsightType.TREND)
    assert len(insights_empty) == 0

def test_find_by_entity(repo, base_insight):
    repo.save(base_insight)
    insights = repo.find_by_entity("u1", "e1")
    assert len(insights) == 1
    assert insights[0].id == "ins1"
    
    insights_empty = repo.find_by_entity("u1", "e2")
    assert len(insights_empty) == 0

def test_find_by_user(repo, base_insight):
    repo.save(base_insight)
    
    ins2 = Insight(
        id="ins2", user_id="u2", title="User 2", description="Desc",
        type=InsightType.TREND, confidence=InsightConfidence.HIGH,
        created_at="2026", updated_at="2026"
    )
    repo.save(ins2)
    
    u1_insights = repo.find_by_user("u1")
    assert len(u1_insights) == 1
    assert u1_insights[0].id == "ins1"

def test_exists_and_delete(repo, base_insight):
    repo.save(base_insight)
    assert repo.exists("ins1") is True
    
    repo.delete("ins1")
    assert repo.exists("ins1") is False
    
    with pytest.raises(NotFoundError):
        repo.delete("ins1")
