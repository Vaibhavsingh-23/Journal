"""
insight_repository.py
=====================
Defines the repository contracts and the MongoDB implementation for the Insight Engine.
"""

from typing import List, Optional, Protocol
import pymongo
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError, DuplicateKeyError as MongoDuplicateKeyError, ConnectionFailure

from insight.domain.insight import Insight, InsightType, InsightStatus

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class RepositoryError(Exception):
    """Base class for all repository-related exceptions."""
    pass

class DuplicateKeyError(RepositoryError):
    """Raised when an Insight ID already exists."""
    pass

class ConnectionError(RepositoryError):
    """Raised when the database is unreachable."""
    pass

class NotFoundError(RepositoryError):
    """Raised when an Insight is not found during an update or strict retrieve."""
    pass


# ---------------------------------------------------------------------------
# Protocol Contract
# ---------------------------------------------------------------------------

class InsightRepository(Protocol):
    """
    Contract for persisting and retrieving Insight domain objects.
    """
    def save(self, insight: Insight) -> None:
        ...

    def update(self, insight: Insight) -> None:
        ...

    def get_by_id(self, insight_id: str) -> Optional[Insight]:
        ...

    def find_active(self, user_id: str) -> List[Insight]:
        ...

    def find_by_type(self, user_id: str, insight_type: InsightType) -> List[Insight]:
        ...

    def find_by_entity(self, user_id: str, entity_id: str) -> List[Insight]:
        ...

    def find_by_user(self, user_id: str) -> List[Insight]:
        ...
        
    def exists(self, id: str) -> bool:
        ...
        
    def delete(self, id: str) -> None:
        ...


# ---------------------------------------------------------------------------
# MongoDB Implementation
# ---------------------------------------------------------------------------

SCHEMA_VERSION = "1.0"
PIPELINE_VERSION = "1.0"
INSIGHT_ENGINE_VERSION = "1.0"

class MongoInsightRepository:
    """MongoDB implementation of the InsightRepository contract."""

    def __init__(self, db: Database):
        self.collection: Collection = db["insights"]
        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        """Create optimized indexes for retrieval."""
        try:
            self.collection.create_index("id", unique=True, background=True)
            self.collection.create_index("user_id", background=True)
            self.collection.create_index("status", background=True)
            self.collection.create_index("type", background=True)
            self.collection.create_index("affected_entity_ids", background=True)
            self.collection.create_index("supporting_memory_ids", background=True)
            self.collection.create_index("importance", background=True)
            self.collection.create_index("updated_at", background=True)
            
            # Compound indexes
            self.collection.create_index(
                [("user_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING)],
                background=True
            )
            self.collection.create_index(
                [("user_id", pymongo.ASCENDING), ("type", pymongo.ASCENDING)],
                background=True
            )
        except ConnectionFailure as e:
            raise ConnectionError(f"Database connection failed during index creation: {e}")
        except PyMongoError as e:
            raise RepositoryError(f"Failed to create indexes: {e}")

    def _inject_metadata(self, doc: dict) -> dict:
        """Injects system version metadata without polluting domain object."""
        doc["_metadata"] = {
            "schema_version": SCHEMA_VERSION,
            "pipeline_version": PIPELINE_VERSION,
            "insight_engine_version": INSIGHT_ENGINE_VERSION
        }
        return doc

    def _strip_metadata(self, doc: dict) -> dict:
        """Removes MongoDB internal fields and metadata before reconstructing domain model."""
        doc.pop("_id", None)
        doc.pop("_metadata", None)
        return doc

    def _handle_pymongo_errors(self, func):
        """Helper to translate exceptions."""
        try:
            return func()
        except MongoDuplicateKeyError as e:
            raise DuplicateKeyError(f"Insight ID already exists: {e}")
        except ConnectionFailure as e:
            raise ConnectionError(f"Database connection failed: {e}")
        except PyMongoError as e:
            raise RepositoryError(f"Database operation failed: {e}")

    def save(self, insight: Insight) -> None:
        def do_save():
            doc = insight.model_dump()
            doc = self._inject_metadata(doc)
            self.collection.insert_one(doc)
        self._handle_pymongo_errors(do_save)

    def update(self, insight: Insight) -> None:
        def do_update():
            # Update specific mutable fields
            # Evidence is immutable in domain, so replacing the array is safe as it's an append
            doc = insight.model_dump()
            doc = self._inject_metadata(doc)
            
            result = self.collection.update_one(
                {"id": insight.id},
                {"$set": doc}
            )
            if result.matched_count == 0:
                raise NotFoundError(f"Insight {insight.id} not found for update.")
        self._handle_pymongo_errors(do_update)

    def get_by_id(self, insight_id: str) -> Optional[Insight]:
        def do_get():
            doc = self.collection.find_one({"id": insight_id})
            if doc:
                return Insight(**self._strip_metadata(doc))
            return None
        return self._handle_pymongo_errors(do_get)

    def find_active(self, user_id: str) -> List[Insight]:
        def do_find():
            cursor = self.collection.find({
                "user_id": user_id,
                "status": InsightStatus.ACTIVE.value
            })
            return [Insight(**self._strip_metadata(doc)) for doc in cursor]
        return self._handle_pymongo_errors(do_find)

    def find_by_type(self, user_id: str, insight_type: InsightType) -> List[Insight]:
        def do_find():
            cursor = self.collection.find({
                "user_id": user_id,
                "type": insight_type.value
            })
            return [Insight(**self._strip_metadata(doc)) for doc in cursor]
        return self._handle_pymongo_errors(do_find)

    def find_by_entity(self, user_id: str, entity_id: str) -> List[Insight]:
        def do_find():
            cursor = self.collection.find({
                "user_id": user_id,
                "affected_entity_ids": entity_id
            })
            return [Insight(**self._strip_metadata(doc)) for doc in cursor]
        return self._handle_pymongo_errors(do_find)

    def find_by_user(self, user_id: str) -> List[Insight]:
        def do_find():
            cursor = self.collection.find({"user_id": user_id})
            return [Insight(**self._strip_metadata(doc)) for doc in cursor]
        return self._handle_pymongo_errors(do_find)
        
    def exists(self, id: str) -> bool:
        def do_exists():
            return self.collection.count_documents({"id": id}, limit=1) > 0
        return self._handle_pymongo_errors(do_exists)
        
    def delete(self, id: str) -> None:
        def do_delete():
            result = self.collection.delete_one({"id": id})
            if result.deleted_count == 0:
                raise NotFoundError(f"Insight {id} not found for deletion.")
        self._handle_pymongo_errors(do_delete)
