"""
resolution_service.py
=====================
Service for resolving raw entity names to Canonical Entities.

Purpose:
Takes a KnowledgeObject (containing raw, unresolved entities) and matches them
to existing canonical Entities in the user's World Model, or mints new ones.
Updates the KnowledgeObject with canonical IDs and normalized names.
"""

import uuid
from datetime import datetime
from capture.domain.knowledge_object import KnowledgeObject
from capture.domain.entity import Entity
from capture.repositories.entity_repository import EntityRepository

class ResolutionService:
    """Service handling the Entity Resolution phase of the pipeline."""

    def __init__(self, entity_repository: EntityRepository):
        self.entity_repository = entity_repository

    def resolve(self, knowledge_object: KnowledgeObject) -> KnowledgeObject:
        """
        Resolve raw entity strings into Canonical Entity objects.
        
        Args:
            knowledge_object: The KnowledgeObject containing raw extracted entities.
            
        Returns:
            KnowledgeObject: An updated KnowledgeObject with canonical entity references.
        """
        user_id = knowledge_object.user_id
        timestamp = knowledge_object.created_at or datetime.utcnow().isoformat() + "Z"

        resolved_entities = []

        for raw_entity in knowledge_object.entities:
            # Deterministic Matching Strategy (V1)
            raw_name = raw_entity.name
            
            # Case-insensitive, trim whitespace exact match
            canonical_name = raw_name.strip().lower()

            # Skip empty entities
            if not canonical_name:
                continue

            # Query existing canonical entity
            existing_entity = self.entity_repository.find_by_name(canonical_name, user_id)

            if existing_entity:
                # Reuse existing entity
                # Optionally add the raw_name to aliases if it's new
                if raw_name not in existing_entity.aliases:
                    existing_entity.aliases.append(raw_name)
                    existing_entity.updated_at = timestamp
                    self.entity_repository.update(existing_entity)
                
                resolved_entities.append(existing_entity)
            else:
                # Create new canonical entity
                new_entity_id = f"ent_{uuid.uuid4().hex}"
                new_entity = Entity(
                    id=new_entity_id,
                    name=canonical_name,
                    entity_type=raw_entity.entity_type,
                    aliases=[raw_name],  # Original name is the first alias
                    user_id=user_id,
                    created_at=timestamp,
                    updated_at=timestamp
                )
                self.entity_repository.save(new_entity)
                resolved_entities.append(new_entity)

        # Update the KnowledgeObject with resolved entities
        knowledge_object.entities = resolved_entities
        
        return knowledge_object
