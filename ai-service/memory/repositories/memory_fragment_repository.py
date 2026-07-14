"""
memory_fragment_repository.py
=============================
Repository interface and MongoDB implementation for MemoryFragment persistence.

Purpose:
Defines the contract for storing and retrieving immutable MemoryFragments.
"""

from typing import Protocol, Optional, List
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo import errors

from memory.domain.memory import MemoryFragment
from memory.repositories.exceptions import RepositoryError, DuplicateKeyError, ConnectionError


class MemoryFragmentRepository(Protocol):
    """Interface for MemoryFragment data access."""

    def save(self, fragment: MemoryFragment) -> None:
        """
        Save a new immutable MemoryFragment.
        Should raise a DuplicateKeyError if one already exists for the KnowledgeObject.
        """
        ...

    def get_by_id(self, fragment_id: str) -> Optional[MemoryFragment]:
        """Retrieve a specific MemoryFragment by ID."""
        ...

    def find_by_capture(self, capture_id: str) -> Optional[MemoryFragment]:
        """Retrieve the MemoryFragment associated with a specific Capture."""
        ...

    def find_by_knowledge_object(self, knowledge_object_id: str) -> Optional[MemoryFragment]:
        """Retrieve the MemoryFragment associated with a specific KnowledgeObject."""
        ...

    def find_by_user(self, user_id: str, limit: int = 100, skip: int = 0) -> List[MemoryFragment]:
        """Retrieve a paginated list of MemoryFragments for a user."""
        ...


class MongoMemoryFragmentRepository:
    """
    MongoDB implementation of the MemoryFragmentRepository interface.
    """

    def __init__(self, db: Database):
        """
        Initializes the repository with a MongoDB database instance.
        Builds indexes for efficient retrieval.
        """
        self.collection: Collection = db["memory_fragments"]
        
        try:
            # Enforce idempotency: One MemoryFragment per KnowledgeObject
            self.collection.create_index("knowledge_object_id", unique=True)
            # Enforce unique fragment IDs
            self.collection.create_index("id", unique=True)
            # Fast retrieval by capture_id
            self.collection.create_index("capture_id")
            # Fast retrieval by user_id
            self.collection.create_index("user_id")
        except errors.PyMongoError as e:
            raise ConnectionError(f"Failed to initialize memory fragment repository indexes: {e}")

    def save(self, fragment: MemoryFragment) -> None:
        """Save a new immutable MemoryFragment."""
        try:
            doc = fragment.model_dump()
            self.collection.insert_one(doc)
        except errors.DuplicateKeyError as e:
            raise DuplicateKeyError(f"MemoryFragment for KnowledgeObject '{fragment.knowledge_object_id}' already exists.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during save: {e}")

    def get_by_id(self, fragment_id: str) -> Optional[MemoryFragment]:
        """Retrieve a specific MemoryFragment by ID."""
        try:
            doc = self.collection.find_one({"id": fragment_id})
            return self._hydrate(doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during get_by_id: {e}")

    def find_by_capture(self, capture_id: str) -> Optional[MemoryFragment]:
        """Retrieve the MemoryFragment associated with a specific Capture."""
        try:
            doc = self.collection.find_one({"capture_id": capture_id})
            return self._hydrate(doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_capture: {e}")

    def find_by_knowledge_object(self, knowledge_object_id: str) -> Optional[MemoryFragment]:
        """Retrieve the MemoryFragment associated with a specific KnowledgeObject."""
        try:
            doc = self.collection.find_one({"knowledge_object_id": knowledge_object_id})
            return self._hydrate(doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_knowledge_object: {e}")

    def find_by_user(self, user_id: str, limit: int = 100, skip: int = 0) -> List[MemoryFragment]:
        """Retrieve a paginated list of MemoryFragments for a user."""
        try:
            cursor = self.collection.find({"user_id": user_id}).skip(skip).limit(limit)
            return [self._hydrate(doc) for doc in cursor if doc]
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_user: {e}")

    def _hydrate(self, doc: Optional[dict]) -> Optional[MemoryFragment]:
        if not doc:
            return None
        if "_id" in doc:
            del doc["_id"]
        return MemoryFragment(**doc)
