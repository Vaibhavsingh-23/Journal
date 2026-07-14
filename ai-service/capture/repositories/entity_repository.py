"""
entity_repository.py
====================
Repository interface and MongoDB implementation for Entity persistence.

Purpose:
Defines the contract for storing and retrieving Canonical Entities,
and provides a MongoDB-backed implementation.
"""

from typing import Protocol, Optional, List
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo import errors

from capture.domain.entity import Entity
from capture.repositories.knowledge_repository import (
    RepositoryError,
    DuplicateKeyError,
    ConnectionError
)


class EntityRepository(Protocol):
    """Interface for Entity data access."""

    def save(self, entity: Entity) -> None:
        """Save a new Entity to the database."""
        ...

    def get_by_id(self, entity_id: str) -> Optional[Entity]:
        """Find an Entity by its unique ID."""
        ...

    def find_by_name(self, name: str, user_id: str) -> Optional[Entity]:
        """Find an Entity matching a specific canonical name for a user."""
        ...

    def update(self, entity: Entity) -> None:
        """Update an existing Entity."""
        ...

    def exists(self, name: str, user_id: str) -> bool:
        """Check if an Entity exists by canonical name and user."""
        ...


class MongoEntityRepository:
    """
    MongoDB implementation of the EntityRepository interface.
    """

    def __init__(self, db: Database):
        """
        Initializes the repository with a MongoDB database instance.
        Ensures necessary indexes are built for idempotency and fast retrieval.
        """
        self.collection: Collection = db["entities"]
        
        try:
            # Enforce idempotency: One Entity per canonical name per user
            self.collection.create_index([("user_id", 1), ("name", 1)], unique=True)
            # Enforce unique Entity IDs
            self.collection.create_index("id", unique=True)
        except errors.PyMongoError as e:
            raise ConnectionError(f"Failed to initialize entity repository indexes: {e}")

    def save(self, entity: Entity) -> None:
        """Save a new Entity."""
        try:
            doc = entity.model_dump()
            self.collection.insert_one(doc)
        except errors.DuplicateKeyError as e:
            raise DuplicateKeyError(f"Entity with canonical name '{entity.name}' already exists for user '{entity.user_id}'.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during save: {e}")
        except Exception as e:
            raise RepositoryError(f"Unexpected error during save: {e}")

    def get_by_id(self, entity_id: str) -> Optional[Entity]:
        """Find an Entity by its unique ID."""
        try:
            doc = self.collection.find_one({"id": entity_id})
            if not doc:
                return None
            if "_id" in doc:
                del doc["_id"]
            return Entity(**doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during get_by_id: {e}")

    def find_by_name(self, name: str, user_id: str) -> Optional[Entity]:
        """Find an Entity matching a specific canonical name for a user."""
        try:
            doc = self.collection.find_one({"user_id": user_id, "name": name})
            if not doc:
                return None
            if "_id" in doc:
                del doc["_id"]
            return Entity(**doc)
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during find_by_name: {e}")

    def update(self, entity: Entity) -> None:
        """Update an existing Entity."""
        try:
            doc = entity.model_dump()
            result = self.collection.replace_one({"id": entity.id}, doc)
            if result.matched_count == 0:
                raise RepositoryError(f"Cannot update: Entity with id {entity.id} not found.")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during update: {e}")

    def exists(self, name: str, user_id: str) -> bool:
        """Check if an Entity exists by canonical name and user."""
        try:
            count = self.collection.count_documents({"user_id": user_id, "name": name}, limit=1)
            return count > 0
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during exists check: {e}")
