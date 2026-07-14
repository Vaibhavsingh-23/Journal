"""
knowledge_repository.py
=======================
Repository interface and MongoDB implementation for Knowledge Object persistence.

Purpose:
Defines the contract for storing and retrieving synthesized Knowledge Objects,
and provides a MongoDB-backed implementation.

Expected Future PRs:
- Integration with the Capture Pipeline.
"""

from typing import Protocol, Optional
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo import errors

from capture.domain.knowledge_object import KnowledgeObject
from capture.versioning import SCHEMA_VERSION, PROMPT_VERSION, PIPELINE_VERSION


class RepositoryError(Exception):
    """Base exception for all repository-related errors."""
    pass

class DuplicateKeyError(RepositoryError):
    """Raised when attempting to insert a duplicate Knowledge Object."""
    pass

class ConnectionError(RepositoryError):
    """Raised when there is a database connection issue."""
    pass


class KnowledgeRepository(Protocol):
    """Interface for Knowledge Object data access."""

    def save(self, knowledge_object: KnowledgeObject) -> None:
        """Save a new Knowledge Object to the database."""
        ...

    def get_by_id(self, knowledge_id: str) -> Optional[KnowledgeObject]:
        """Find a Knowledge Object by its unique ID."""
        ...

    def get_by_capture_id(self, capture_id: str) -> Optional[KnowledgeObject]:
        """Find a Knowledge Object by its source capture ID."""
        ...

    def exists(self, capture_id: str) -> bool:
        """Check if a Knowledge Object exists for a given capture ID."""
        ...

    def update(self, knowledge_object: KnowledgeObject) -> None:
        """Update an existing Knowledge Object."""
        ...


class MongoKnowledgeRepository:
    """
    MongoDB implementation of the KnowledgeRepository interface.
    Persists the entire KnowledgeObject as a single document.
    """

    def __init__(self, db: Database):
        """
        Initializes the repository with a MongoDB database instance.
        Ensures necessary indexes are built for idempotency and fast retrieval.
        """
        self.collection: Collection = db["knowledge_objects"]
        
        try:
            # Enforce idempotency: One KnowledgeObject per Capture
            self.collection.create_index("provenance.capture_id", unique=True)
            # Enforce unique KnowledgeObject IDs
            self.collection.create_index("id", unique=True)
        except errors.PyMongoError as e:
            raise ConnectionError(f"Failed to initialize repository indexes: {e}")

    def save(self, knowledge_object: KnowledgeObject) -> None:
        """Save a new Knowledge Object with version metadata."""
        try:
            doc = knowledge_object.model_dump()
            
            # Inject version metadata directly into the document
            doc["_version_metadata"] = {
                "schema_version": SCHEMA_VERSION,
                "prompt_version": PROMPT_VERSION,
                "extraction_version": PIPELINE_VERSION
            }
            
            # Use the internal ID as the mongo _id for cleaner storage if desired,
            # but here we just store it as a field and let Mongo generate its own _id.
            self.collection.insert_one(doc)
            
        except errors.DuplicateKeyError as e:
            raise DuplicateKeyError(f"KnowledgeObject already exists. Detail: {e}")
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during save: {e}")
        except Exception as e:
            raise RepositoryError(f"Unexpected error during save: {e}")

    def get_by_id(self, knowledge_id: str) -> Optional[KnowledgeObject]:
        """Retrieve by unique knowledge ID."""
        try:
            doc = self.collection.find_one({"id": knowledge_id})
            if not doc:
                return None
            
            # Remove mongo internal _id before hydrating Pydantic model
            if "_id" in doc:
                del doc["_id"]
            if "_version_metadata" in doc:
                del doc["_version_metadata"]
                
            return KnowledgeObject(**doc)
            
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during get_by_id: {e}")

    def get_by_capture_id(self, capture_id: str) -> Optional[KnowledgeObject]:
        """Retrieve by source capture ID."""
        try:
            doc = self.collection.find_one({"provenance.capture_id": capture_id})
            if not doc:
                return None
            
            if "_id" in doc:
                del doc["_id"]
            if "_version_metadata" in doc:
                del doc["_version_metadata"]
                
            return KnowledgeObject(**doc)
            
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during get_by_capture_id: {e}")

    def exists(self, capture_id: str) -> bool:
        """Check if a Knowledge Object exists for the given capture ID."""
        try:
            count = self.collection.count_documents({"provenance.capture_id": capture_id}, limit=1)
            return count > 0
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during exists check: {e}")

    def update(self, knowledge_object: KnowledgeObject) -> None:
        """Update an existing Knowledge Object in its entirety."""
        try:
            doc = knowledge_object.model_dump()
            
            doc["_version_metadata"] = {
                "schema_version": SCHEMA_VERSION,
                "prompt_version": PROMPT_VERSION,
                "extraction_version": PIPELINE_VERSION
            }
            
            result = self.collection.replace_one(
                {"id": knowledge_object.id},
                doc
            )
            
            if result.matched_count == 0:
                raise RepositoryError(f"Cannot update: KnowledgeObject with id {knowledge_object.id} not found.")
                
        except errors.PyMongoError as e:
            raise RepositoryError(f"Database error during update: {e}")
