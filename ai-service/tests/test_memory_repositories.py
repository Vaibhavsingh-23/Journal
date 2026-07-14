import pytest
import mongomock

from memory.domain.memory import MemoryFragment, Memory, MemoryType, MemoryStatus
from memory.repositories.memory_fragment_repository import MongoMemoryFragmentRepository
from memory.repositories.memory_repository import MongoMemoryRepository
from memory.repositories.exceptions import DuplicateKeyError, NotFoundError

# ---------------------------------------------------------------------------
# Test Data Helpers
# ---------------------------------------------------------------------------

def create_mock_fragment(frag_id="frag_1", ko_id="ko_1", cap_id="cap_1") -> MemoryFragment:
    return MemoryFragment(
        id=frag_id,
        user_id="usr_1",
        knowledge_object_id=ko_id,
        capture_id=cap_id,
        content="This is a test fragment.",
        entity_ids=[],
        created_at="2026-07-14T12:00:00Z"
    )

def create_mock_memory(mem_id="mem_1", user_id="usr_1", status=MemoryStatus.ACTIVE) -> Memory:
    return Memory(
        id=mem_id,
        user_id=user_id,
        memory_type=MemoryType.PROJECT,
        status=status,
        summary="Test Memory Summary",
        fragment_ids=["frag_1"],
        entity_ids=[],
        created_at="2026-07-14T12:00:00Z",
        updated_at="2026-07-14T12:00:00Z"
    )

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    return client.journaldb

@pytest.fixture
def frag_repo(mock_db):
    return MongoMemoryFragmentRepository(mock_db)

@pytest.fixture
def mem_repo(mock_db):
    return MongoMemoryRepository(mock_db)


# ---------------------------------------------------------------------------
# MemoryFragmentRepository Tests
# ---------------------------------------------------------------------------

def test_fragment_save_and_retrieve(frag_repo):
    frag = create_mock_fragment("frag_123", "ko_123", "cap_123")
    
    frag_repo.save(frag)
    
    # get_by_id
    retrieved = frag_repo.get_by_id("frag_123")
    assert retrieved is not None
    assert retrieved.id == "frag_123"
    
    # find_by_capture
    retrieved_by_cap = frag_repo.find_by_capture("cap_123")
    assert retrieved_by_cap is not None
    
    # find_by_knowledge_object
    retrieved_by_ko = frag_repo.find_by_knowledge_object("ko_123")
    assert retrieved_by_ko is not None
    
    # find_by_user
    user_frags = frag_repo.find_by_user("usr_1")
    assert len(user_frags) == 1

def test_fragment_duplicate_knowledge_object_prevention(frag_repo):
    frag1 = create_mock_fragment("frag_1", "ko_same", "cap_1")
    frag2 = create_mock_fragment("frag_2", "ko_same", "cap_2")
    
    frag_repo.save(frag1)
    
    with pytest.raises(DuplicateKeyError):
        frag_repo.save(frag2)


# ---------------------------------------------------------------------------
# MemoryRepository Tests
# ---------------------------------------------------------------------------

def test_memory_save_and_retrieve(mem_repo):
    mem = create_mock_memory("mem_123", "usr_1")
    
    mem_repo.save(mem)
    
    retrieved = mem_repo.get_by_id("mem_123")
    assert retrieved is not None
    assert retrieved.summary == "Test Memory Summary"

def test_memory_update(mem_repo):
    mem = create_mock_memory("mem_upd", "usr_1")
    mem_repo.save(mem)
    
    mem.summary = "Updated Summary"
    mem.fragment_ids.append("frag_2")
    
    mem_repo.update(mem)
    
    retrieved = mem_repo.get_by_id("mem_upd")
    assert retrieved.summary == "Updated Summary"
    assert len(retrieved.fragment_ids) == 2

def test_memory_update_not_found(mem_repo):
    mem = create_mock_memory("mem_missing", "usr_1")
    
    with pytest.raises(NotFoundError):
        mem_repo.update(mem)

def test_memory_filtering(mem_repo):
    mem1 = create_mock_memory("mem_1", "usr_1", MemoryStatus.ACTIVE)
    mem2 = create_mock_memory("mem_2", "usr_1", MemoryStatus.ARCHIVED)
    
    # Different user
    mem3 = create_mock_memory("mem_3", "usr_2", MemoryStatus.ACTIVE)
    
    mem_repo.save(mem1)
    mem_repo.save(mem2)
    mem_repo.save(mem3)
    
    # find_by_user
    user_mems = mem_repo.find_by_user("usr_1")
    assert len(user_mems) == 2
    
    # find_active
    active_mems = mem_repo.find_active("usr_1")
    assert len(active_mems) == 1
    assert active_mems[0].id == "mem_1"
    
    # find_by_type
    project_mems = mem_repo.find_by_type("usr_1", MemoryType.PROJECT)
    assert len(project_mems) == 2

def test_memory_delete(mem_repo):
    mem = create_mock_memory("mem_del", "usr_1")
    mem_repo.save(mem)
    
    assert mem_repo.get_by_id("mem_del") is not None
    
    mem_repo.delete("mem_del")
    
    assert mem_repo.get_by_id("mem_del") is None

def test_memory_delete_not_found(mem_repo):
    with pytest.raises(NotFoundError):
        mem_repo.delete("mem_missing")
