"""
memory_repository.py
====================
Repository interface and MongoDB implementation for mutable Memory persistence.

Purpose:
Defines the contract for storing, retrieving, and updating mutable Memory objects.
"""

from typing import Protocol, Optional, List
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo import errors

from memory.domain.memory import Memory, MemoryType, MemoryStatus
from memory.repositories.exceptions import RepositoryError, DuplicateKeyError, ConnectionError, NotFoundError


class MemoryRepository(Protocol):
    """Interface for Memory data access."""

    def save(self, memory: Memory) -> None:
        """Save a new Memory object."""
        ...

    def get_by_id(self, memory_id: str) -> Optional[Memory]:
        """Retrieve a specific Memory by ID."""
        ...

    def update(self, memory: Memory) -> None:
        """
        Update an existing Memory object.
        Usually called after fragments are added or the summary evolves.
        """
        ...

    def find_by_user(self, user_id: str, limit: int = 50, skip: int = 0) -> List[Memory]:
        """Retrieve a paginated list of Memories for a user."""
        ...

    def find_active(self, user_id: str) -> List[Memory]:
        """Find active memories for a user."""
        ...

    def find_by_type(self, user_id: str, memory_type: MemoryType) -> List[Memory]:
        """Find memories of a specific type (e.g., ongoing projects or relationships)."""
        ...

    def delete(self, memory_id: str) -> None:
        """
        Delete a high-level Memory. 
        Note: This must NEVER delete the underlying MemoryFragments.
        """
        ...


class MongoMemoryRepository:
    """
    MongoDB implementation of the MemoryRepository interface.
    """

    def __init__(self, db: Database):
        """
        Initializes the repository with a MongoDB database instance.
        Builds indexes for efficient retrieval.
        """
        self.collection: Collection = db["memories"]
        
        try:
            # Enforce unique memory IDs
            self.collection.create_index("id", unique=True)
            # Fast retrieval by user
            self.collection.create_index("user_id")
            # Index for querying by status
            self.collection.create_index("status")
            # Index for querying by type
            self.collection.create_index("memory_type")
        except errors.PyMongoError as e:
            raise ConnectionError(f"Failed to initialize memory repository indexes: {e}")

    def save(self, memory: Memory) -> None:
        """Save a new Memory."""
        try:
            doc = memory.model_dump()
            self.collection.insert_one(doc)
        except errors.DuplicateKeyError as e:
            raise DuplicateKeyError(f"Memory with ID '{memory.id}' already exists.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during save: {e}")

    def get_by_id(self, memory_id: str) -> Optional[Memory]:
        """Retrieve a specific Memory by ID."""
        try:
            doc = self.collection.find_one({"id": memory_id})
            return self._hydrate(doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during get_by_id: {e}")

    def update(self, memory: Memory) -> None:
        """Update an existing Memory."""
        try:
            doc = memory.model_dump()
            result = self.collection.replace_one({"id": memory.id}, doc)
            if result.matched_count == 0:
                raise NotFoundError(f"Cannot update: Memory with id {memory.id} not found.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during update: {e}")

    def find_by_user(self, user_id: str, limit: int = 50, skip: int = 0) -> List[Memory]:
        """Retrieve a paginated list of Memories for a user."""
        try:
            cursor = self.collection.find({"user_id": user_id}).skip(skip).limit(limit)
            return [self._hydrate(doc) for doc in cursor if doc]
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_user: {e}")

    def find_active(self, user_id: str) -> List[Memory]:
        """Find active memories for a user."""
        try:
            cursor = self.collection.find({
                "user_id": user_id, 
                "status": MemoryStatus.ACTIVE.value
            })
            return [self._hydrate(doc) for doc in cursor if doc]
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_active: {e}")

    def find_by_type(self, user_id: str, memory_type: MemoryType) -> List[Memory]:
        """Find memories of a specific type (e.g., ongoing projects or relationships)."""
        try:
            cursor = self.collection.find({
                "user_id": user_id, 
                "memory_type": memory_type.value
            })
            return [self._hydrate(doc) for doc in cursor if doc]
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_type: {e}")
            
    def delete(self, memory_id: str) -> None:
        """Delete a high-level Memory."""
        try:
            result = self.collection.delete_one({"id": memory_id})
            if result.deleted_count == 0:
                raise NotFoundError(f"Cannot delete: Memory with id {memory_id} not found.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during delete: {e}")

    def _hydrate(self, doc: Optional[dict]) -> Optional[Memory]:
        if not doc:
            return None
        if "_id" in doc:
            del doc["_id"]
        return Memory(**doc)
