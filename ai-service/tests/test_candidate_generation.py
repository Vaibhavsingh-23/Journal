import pytest
from datetime import datetime, timezone, timedelta

from memory.domain.memory import Memory, MemoryType, MemoryStatus
from insight.domain.insight import InsightType
from insight.services.candidate_generation_service import CandidateGenerationService

@pytest.fixture
def service():
    return CandidateGenerationService()

def build_memory(id: str, type: MemoryType, entity_ids: list, days_ago: int = 0, status: MemoryStatus = MemoryStatus.ACTIVE):
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return Memory(
        id=id,
        user_id="u1",
        memory_type=type,
        status=status,
        title=f"Mem {id}",
        summary="summary",
        fragment_ids=["f1"],
        entity_ids=entity_ids,
        created_at=dt.isoformat(),
        updated_at=dt.isoformat()
    )

def test_single_memory_produces_no_candidate(service):
    mems = [build_memory("1", MemoryType.RELATIONAL, ["e1"])]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 0

def test_trend_detection(service):
    # 3 Semantic memories spanning > 7 days
    mems = [
        build_memory("1", MemoryType.SEMANTIC, ["e1"], days_ago=0),
        build_memory("2", MemoryType.SEMANTIC, ["e1"], days_ago=5),
        build_memory("3", MemoryType.SEMANTIC, ["e1"], days_ago=10),
    ]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 1
    assert candidates[0].candidate_type == InsightType.TREND
    assert candidates[0].affected_entity_ids == ["e1"]

def test_habit_detection(service):
    # 4 Episodic memories spanning <= 14 days
    mems = [
        build_memory("1", MemoryType.EPISODIC, ["gym"], days_ago=1),
        build_memory("2", MemoryType.EPISODIC, ["gym"], days_ago=2),
        build_memory("3", MemoryType.EPISODIC, ["gym"], days_ago=3),
        build_memory("4", MemoryType.EPISODIC, ["gym"], days_ago=4),
    ]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 1
    assert candidates[0].candidate_type == InsightType.HABIT
    assert len(candidates[0].supporting_memory_ids) == 4

def test_relationship_grouping(service):
    # 3 Relational memories
    mems = [
        build_memory("1", MemoryType.RELATIONAL, ["alice"], days_ago=1),
        build_memory("2", MemoryType.RELATIONAL, ["alice"], days_ago=2),
        build_memory("3", MemoryType.RELATIONAL, ["alice"], days_ago=3),
    ]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 1
    assert candidates[0].candidate_type == InsightType.RELATIONSHIP

def test_goal_grouping(service):
    # 2 Goal memories
    mems = [
        build_memory("1", MemoryType.GOAL, ["marathon"], days_ago=1),
        build_memory("2", MemoryType.GOAL, ["marathon"], days_ago=2),
    ]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 1
    assert candidates[0].candidate_type == InsightType.GOAL_PROGRESS

def test_contradiction_detection(service):
    # 2 Semantic memories spaced > 30 days
    mems = [
        build_memory("1", MemoryType.SEMANTIC, ["diet"], days_ago=0),
        build_memory("2", MemoryType.SEMANTIC, ["diet"], days_ago=35),
    ]
    candidates = service.generate_candidates("u1", mems)
    assert len(candidates) == 1
    assert candidates[0].candidate_type == InsightType.CONTRADICTION

def test_opportunity_detection(service):
    # Entity co-occurrence >= 3 memories
    mems = [
        build_memory("1", MemoryType.EPISODIC, ["redis", "kafka", "java"]),
        build_memory("2", MemoryType.EPISODIC, ["redis", "kafka"]),
        build_memory("3", MemoryType.PROJECT, ["redis", "kafka"]),
    ]
    candidates = service.generate_candidates("u1", mems)
    # Opportunity should be grouped for ("kafka", "redis") sorted.
    # Note: we sorted them in generator. "kafka" is first.
    opp_candidates = [c for c in candidates if c.candidate_type == InsightType.OPPORTUNITY]
    assert len(opp_candidates) == 1
    assert set(opp_candidates[0].affected_entity_ids) == {"kafka", "redis"}

def test_duplicate_prevention_merging(service):
    # If some logic produces multiple candidates for the exact same entities and type, they should merge.
    # We will mock the generator to return 2 duplicate candidates.
    c1 = service._detect_goal_progress([
        build_memory("1", MemoryType.GOAL, ["g1"]),
        build_memory("2", MemoryType.GOAL, ["g1"]),
    ])[0]
    
    c2 = service._detect_goal_progress([
        build_memory("3", MemoryType.GOAL, ["g1"]),
        build_memory("4", MemoryType.GOAL, ["g1"]),
    ])[0]
    c2.candidate_score = 0.99
    
    merged = service._merge_duplicates([c1, c2])
    assert len(merged) == 1
    assert merged[0].candidate_score == 0.99
    assert set(merged[0].supporting_memory_ids) == {"1", "2", "3", "4"}

def test_deterministic_scoring(service):
    score1 = service._score(memory_count=5, time_span_days=30, entity_density=1.0)
    assert score1 == 1.0
    
    score2 = service._score(memory_count=1, time_span_days=0, entity_density=1.0)
    # 1/5*0.5 + 0 + 1*0.2 = 0.1 + 0.2 = 0.3
    assert abs(score2 - 0.3) < 0.01

def test_empty_memory_set(service):
    assert len(service.generate_candidates("u1", [])) == 0

def test_ignores_non_active_memories(service):
    mems = [
        build_memory("1", MemoryType.RELATIONAL, ["alice"], status=MemoryStatus.ARCHIVED),
        build_memory("2", MemoryType.RELATIONAL, ["alice"], status=MemoryStatus.CONSOLIDATED),
        build_memory("3", MemoryType.RELATIONAL, ["alice"], status=MemoryStatus.ACTIVE),
    ]
    candidates = service.generate_candidates("u1", mems)
    # Only 1 ACTIVE memory, which is < 3 required for relationship
    assert len(candidates) == 0
