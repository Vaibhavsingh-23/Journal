import pytest
from unittest.mock import MagicMock, patch

from memory.retrieval.retrieval_gateway import RetrievalGateway
from memory.retrieval.retrieval_models import MemoryRetrievalResult, RetrievedEvidence
from capture.domain.knowledge_object import KnowledgeObject, Provenance, CaptureType
from capture.domain.observation import Observation, ObservationType, Perspective, Confidence

def test_gateway_memory_success():
    memory_engine = MagicMock()
    # Construct a valid evidence
    ko = KnowledgeObject(
        id="ko1", user_id="u1", 
        provenance=Provenance(capture_id="cap1", capture_type=CaptureType.JOURNAL, source_uri="uri"),
        summary="Test", observations=[], created_at="2026"
    )
    evidence = RetrievedEvidence(memory_id="mem1", fragments=[], knowledge_objects=[ko])
    
    memory_engine.retrieve_answer.return_value = MemoryRetrievalResult(
        answer="I have found a memory.",
        evidence=[evidence],
        status="SUCCESS"
    )
    
    gateway = RetrievalGateway(memory_engine)
    result = gateway.answer_question("u1", "What did I do?")
    
    assert result["engine"] == "MEMORY"
    assert result["answer"] == "I have found a memory."
    assert "cap1" in result["sources"]

@patch("memory.retrieval.retrieval_gateway.ask_journal")
def test_gateway_memory_empty_fallback(mock_ask_journal):
    memory_engine = MagicMock()
    # Memory engine returns success but no evidence
    memory_engine.retrieve_answer.return_value = MemoryRetrievalResult(
        answer="There is no relevant memory.",
        evidence=[],
        status="SUCCESS"
    )
    
    mock_ask_journal.return_value = {
        "answer": "This is from RAG.",
        "sources": ["2026-06-20"]
    }
    
    gateway = RetrievalGateway(memory_engine)
    result = gateway.answer_question("u1", "What did I do?")
    
    assert result["engine"] == "RAG"
    assert result["answer"] == "This is from RAG."
    assert "2026-06-20" in result["sources"]
    mock_ask_journal.assert_called_once_with(question="What did I do?", user_id="u1")

@patch("memory.retrieval.retrieval_gateway.ask_journal")
def test_gateway_memory_exception_fallback(mock_ask_journal):
    memory_engine = MagicMock()
    # Memory engine throws an exception
    memory_engine.retrieve_answer.side_effect = Exception("Memory DB is down")
    
    mock_ask_journal.return_value = {
        "answer": "RAG fallback answer.",
        "sources": ["cap2"]
    }
    
    gateway = RetrievalGateway(memory_engine)
    result = gateway.answer_question("u1", "What did I do?")
    
    assert result["engine"] == "RAG"
    assert result["answer"] == "RAG fallback answer."
    mock_ask_journal.assert_called_once_with(question="What did I do?", user_id="u1")

@patch("memory.retrieval.retrieval_gateway.ask_journal")
def test_gateway_both_fail(mock_ask_journal):
    memory_engine = MagicMock()
    memory_engine.retrieve_answer.side_effect = Exception("Memory DB is down")
    
    mock_ask_journal.side_effect = Exception("Pinecone is down")
    
    gateway = RetrievalGateway(memory_engine)
    result = gateway.answer_question("u1", "What did I do?")
    
    assert result["engine"] == "ERROR"
    assert "An error occurred" in result["answer"]
    assert "Pinecone is down" in result["error"]
