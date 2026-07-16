import pytest
from unittest.mock import MagicMock, patch

from memory.domain.memory import Memory, MemoryType, MemoryStatus, MemoryFragment
from capture.domain.knowledge_object import KnowledgeObject, Provenance, CaptureType
from capture.domain.observation import Observation, ObservationType, Perspective, Confidence

from memory.retrieval.retrieval_models import QuestionAnalysis, MemoryCandidate, RankedMemory
from memory.retrieval.question_analysis_service import QuestionAnalysisService
from memory.retrieval.memory_ranker import MemoryRanker
from memory.retrieval.context_builder import ContextBuilder
from memory.retrieval.memory_retrieval_engine import MemoryRetrievalEngine

def test_question_analysis_fallback():
    # When no client is available, should fallback gracefully
    with patch("memory.retrieval.question_analysis_service.genai.Client", return_value=None):
        service = QuestionAnalysisService()
        analysis = service.analyze("What is my project status?")
        assert analysis.intent == "RECALL"
        assert analysis.temporal_constraints == "ALL"

def test_memory_ranker():
    ranker = MemoryRanker()
    mem1 = Memory(
        id="mem1", user_id="u1", memory_type=MemoryType.EPISODIC,
        status=MemoryStatus.ACTIVE, summary="Learning python and redis.",
        entity_ids=["redis", "python"], fragment_ids=["frag1", "frag2"],
        created_at="2026", updated_at="2026"
    )
    mem2 = Memory(
        id="mem2", user_id="u1", memory_type=MemoryType.PROJECT,
        status=MemoryStatus.ACTIVE, summary="Working on frontend.",
        entity_ids=["react"], fragment_ids=["frag3"],
        created_at="2026", updated_at="2026"
    )
    candidates = [mem1, mem2]
    
    analysis = QuestionAnalysis(
        intent="LEARNING", entities=["redis"], memory_types=[MemoryType.EPISODIC], keywords=["python"]
    )
    
    ranked = ranker.rank(candidates, analysis)
    assert len(ranked) == 2
    # mem1 has shared entity (redis, +15), keyword match (python, +5), correct type (+10), 2 fragments (+4) = 34
    # mem2 has no shared entity, no keyword, wrong type, 1 fragment (+2) = 2
    assert ranked[0].memory.id == "mem1"
    assert ranked[0].score > ranked[1].score

def test_context_builder():
    builder = ContextBuilder()
    
    mem1 = Memory(
        id="mem1", user_id="u1", memory_type=MemoryType.EPISODIC,
        status=MemoryStatus.ACTIVE, title="Learning Redis", summary="Learning redis.",
        entity_ids=["redis"], fragment_ids=["frag1"], timeline=["Read docs"],
        created_at="2026", updated_at="2026"
    )
    ranked = [RankedMemory(memory=mem1, score=10)]
    
    frag1 = MemoryFragment(
        id="frag1", user_id="u1", knowledge_object_id="ko1", capture_id="cap1",
        content="Read docs", entity_ids=["redis"], created_at="2026"
    )
    ko1 = KnowledgeObject(
        id="ko1", user_id="u1", 
        provenance=Provenance(capture_id="cap1", capture_type=CaptureType.JOURNAL, source_uri="uri"),
        summary="Read docs", observations=[
            Observation(id="obs1", type=ObservationType.STATE, perspective=Perspective.EXPLICIT, description="Redis is fast", confidence=Confidence.HIGH, timestamp="2026")
        ],
        created_at="2026"
    )
    
    from memory.retrieval.retrieval_models import RetrievedEvidence
    evidence = [RetrievedEvidence(memory_id="mem1", fragments=[frag1], knowledge_objects=[ko1])]
    
    context = builder.build_context(ranked, evidence)
    
    assert "Title: Learning Redis\nSummary: Learning redis." in context.memory_summaries
    assert "[Learning Redis] Read docs" in context.recent_timeline
    assert "redis" in context.important_entities
    assert "Redis is fast" in context.supporting_observations
    assert "Source Capture: cap1 (JOURNAL)" in context.evidence_references

@patch("memory.retrieval.memory_retrieval_engine.genai.Client", return_value=None)
@patch("memory.retrieval.question_analysis_service.genai.Client", return_value=None)
def test_retrieval_engine_no_memories(mock_genai_engine, mock_genai_qa):
    # Mock repos
    memory_repo = MagicMock()
    memory_repo.find_active.return_value = [] # No memories
    fragment_repo = MagicMock()
    knowledge_repo = MagicMock()
    
    qa_service = QuestionAnalysisService()
    ranker = MemoryRanker()
    context_builder = ContextBuilder()
    
    engine = MemoryRetrievalEngine(memory_repo, fragment_repo, knowledge_repo, qa_service, ranker, context_builder)
    
    # Engine does not have a real client due to patch, it will return generic if logic goes there
    # But since no memories, it should return early
    result = engine.retrieve_answer("u1", "What did I do?")
    
    assert result.status == "SUCCESS"
    assert "no relevant memory" in result.answer
    assert len(result.evidence) == 0

@patch("memory.retrieval.memory_retrieval_engine.genai.Client", return_value=None)
@patch("memory.retrieval.question_analysis_service.genai.Client", return_value=None)
def test_retrieval_engine_with_memories(mock_genai_engine, mock_genai_qa):
    mem1 = Memory(
        id="mem1", user_id="u1", memory_type=MemoryType.EPISODIC,
        status=MemoryStatus.ACTIVE, title="Learning Redis", summary="Learning redis.",
        entity_ids=["redis"], fragment_ids=["frag1"], timeline=["Read docs"],
        created_at="2026", updated_at="2026"
    )
    
    memory_repo = MagicMock()
    memory_repo.find_active.return_value = [mem1]
    
    frag1 = MemoryFragment(
        id="frag1", user_id="u1", knowledge_object_id="ko1", capture_id="cap1",
        content="Read docs", entity_ids=["redis"], created_at="2026"
    )
    fragment_repo = MagicMock()
    fragment_repo.get_by_id.return_value = frag1
    
    ko1 = KnowledgeObject(
        id="ko1", user_id="u1", 
        provenance=Provenance(capture_id="cap1", capture_type=CaptureType.JOURNAL, source_uri="uri"),
        summary="Read docs", observations=[
            Observation(id="obs1", type=ObservationType.STATE, perspective=Perspective.EXPLICIT, description="Redis is fast", confidence=Confidence.HIGH, timestamp="2026")
        ],
        created_at="2026"
    )
    knowledge_repo = MagicMock()
    knowledge_repo.get_by_id.return_value = ko1
    
    qa_service = QuestionAnalysisService()
    ranker = MemoryRanker()
    context_builder = ContextBuilder()
    
    engine = MemoryRetrievalEngine(memory_repo, fragment_repo, knowledge_repo, qa_service, ranker, context_builder)
    
    result = engine.retrieve_answer("u1", "Tell me about redis.")
    
    assert result.status == "SUCCESS"
    assert "Simulated Answer based on Context." in result.answer
    assert len(result.evidence) == 1
    assert result.evidence[0].memory_id == "mem1"
    assert len(result.evidence[0].fragments) == 1
    assert len(result.evidence[0].knowledge_objects) == 1
