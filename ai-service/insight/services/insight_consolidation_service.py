"""
insight_consolidation_service.py
================================
Manages the lifecycle of Insights: Creation, Updates, Merges, Archiving, and Superseding.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from insight.domain.insight import Insight, InsightStatus, InsightEvidence, InsightType
from insight.domain.candidate import InsightCandidate
from insight.domain.validation import InsightValidationResult
from insight.domain.consolidation import InsightConsolidationResult, ConsolidationAction
from insight.repositories.insight_repository import InsightRepository

logger = logging.getLogger(__name__)

class ConsolidationError(Exception):
    """Raised when consolidation fails, preventing partial writes."""
    pass

class InsightConsolidationService:
    def __init__(self, repository: InsightRepository):
        self.repo = repository

    def consolidate(self, user_id: str, candidate: InsightCandidate, validation: InsightValidationResult) -> InsightConsolidationResult:
        """
        Takes a validated candidate and integrates it into the Insight graph.
        """
        try:
            timestamp = datetime.now(timezone.utc).isoformat()
            
            # 1. Reject if validation failed
            if not validation.approved:
                return InsightConsolidationResult(
                    action=ConsolidationAction.REJECTED,
                    affected_insight_ids=[],
                    timestamp=timestamp
                )

            # 2. Retrieve existing insights of the same type
            active_insights = self.repo.find_active(user_id)
            type_insights = [i for i in active_insights if i.type == candidate.candidate_type]

            # 3. Check for Superseding (Contradictions)
            if candidate.candidate_type == InsightType.CONTRADICTION:
                # If we have contradicting memories, let's see if there is an active insight using them
                for ext in active_insights:
                    ext_memory_ids = {ev.memory_id for ev in ext.evidence}
                    if any(c_id in ext_memory_ids for c_id in validation.contradicting_memories):
                        # The new validated contradiction overpowers the old insight
                        ext.status = InsightStatus.SUPERSEDED
                        ext.updated_at = timestamp
                        self.repo.update(ext)
                        
                        new_insight = self._build_new_insight(user_id, candidate, validation, timestamp)
                        self.repo.save(new_insight)
                        
                        return InsightConsolidationResult(
                            action=ConsolidationAction.SUPERSEDED,
                            new_version=1,
                            affected_insight_ids=[ext.id, new_insight.id],
                            timestamp=timestamp
                        )

            # 4. Check for Equivalency (Similarity Check)
            equivalent_insights = []
            for ext in type_insights:
                if self._is_equivalent(candidate, validation, ext):
                    equivalent_insights.append(ext)

            # 5. Execute Action Branches
            if len(equivalent_insights) == 0:
                # CREATE
                new_insight = self._build_new_insight(user_id, candidate, validation, timestamp)
                self.repo.save(new_insight)
                return InsightConsolidationResult(
                    action=ConsolidationAction.CREATED,
                    new_version=1,
                    affected_insight_ids=[new_insight.id],
                    timestamp=timestamp
                )
                
            elif len(equivalent_insights) == 1:
                # UPDATE
                ext = equivalent_insights[0]
                ext.version += 1
                
                conf_enum = self._map_confidence(validation.confidence)
                ext.confidence = conf_enum
                
                ext.title = validation.updated_title
                ext.description = validation.updated_description
                ext.updated_at = timestamp
                
                # Append new evidence immutably
                ext_memory_ids = {ev.memory_id for ev in ext.evidence}
                if not ext_memory_ids:
                    ext_memory_ids = set(ext.supporting_memory_ids)
                    
                conf_enum = self._map_confidence(validation.confidence)
                for new_mem_id in validation.supporting_memories:
                    if new_mem_id not in ext_memory_ids:
                        ext.evidence.append(self._build_evidence(new_mem_id, conf_enum))
                        ext.supporting_memory_ids.append(new_mem_id)
                        
                # Re-sync affected entities
                ext.affected_entity_ids = list(set(ext.affected_entity_ids + candidate.affected_entity_ids))
                
                self.repo.update(ext)
                return InsightConsolidationResult(
                    action=ConsolidationAction.UPDATED,
                    new_version=ext.version,
                    affected_insight_ids=[ext.id],
                    timestamp=timestamp
                )
                
            else:
                # MERGE multiple overlapping insights
                # Take highest confidence as base, consolidate the rest
                equivalent_insights.sort(key=lambda x: x.confidence, reverse=True)
                base = equivalent_insights[0]
                others = equivalent_insights[1:]
                
                base.version += 1
                base.title = validation.updated_title
                base.description = validation.updated_description
                conf_enum = self._map_confidence(validation.confidence)
                base.confidence = conf_enum
                base.updated_at = timestamp
                
                base_memory_ids = {ev.memory_id for ev in base.evidence}
                if not base_memory_ids:
                    base_memory_ids = set(base.supporting_memory_ids)
                
                for new_mem_id in validation.supporting_memories:
                    if new_mem_id not in base_memory_ids:
                        base.evidence.append(self._build_evidence(new_mem_id, conf_enum))
                        base.supporting_memory_ids.append(new_mem_id)
                        base_memory_ids.add(new_mem_id)
                
                affected_ids = [base.id]
                
                for other in others:
                    other.status = InsightStatus.SUPERSEDED
                    other.updated_at = timestamp
                    self.repo.update(other)
                    affected_ids.append(other.id)
                    
                    # siphon their evidence
                    for ev in other.evidence:
                        if ev.memory_id not in base_memory_ids:
                            base.evidence.append(ev)
                            base_memory_ids.add(ev.memory_id)
                    
                    base.affected_entity_ids = list(set(base.affected_entity_ids + other.affected_entity_ids))
                
                self.repo.update(base)
                return InsightConsolidationResult(
                    action=ConsolidationAction.MERGED,
                    new_version=base.version,
                    affected_insight_ids=affected_ids,
                    timestamp=timestamp
                )

        except Exception as e:
            logger.error(f"Consolidation failed: {e}")
            raise ConsolidationError(f"Failed to consolidate: {e}")
            
    def archive_obsolete(self, user_id: str, active_memories: List[str]) -> List[str]:
        """
        Archives active insights whose underlying memory support has vanished.
        Returns a list of archived insight IDs.
        """
        try:
            timestamp = datetime.now(timezone.utc).isoformat()
            active_insights = self.repo.find_active(user_id)
            active_memory_set = set(active_memories)
            
            archived_ids = []
            for insight in active_insights:
                insight_mem_ids = {ev.memory_id for ev in insight.evidence}
                if not insight_mem_ids:
                    insight_mem_ids = set(insight.supporting_memory_ids)
                    
                if not insight_mem_ids.intersection(active_memory_set):
                    insight.status = InsightStatus.ARCHIVED
                    insight.updated_at = timestamp
                    self.repo.update(insight)
                    archived_ids.append(insight.id)
            
            return archived_ids
        except Exception as e:
            logger.error(f"Archiving failed: {e}")
            raise ConsolidationError(f"Failed to archive: {e}")

    def _is_equivalent(self, candidate: InsightCandidate, validation: InsightValidationResult, existing: Insight) -> bool:
        """
        Deterministic equivalence check: >50% entity overlap AND >30% supporting memory overlap.
        """
        cand_entities = set(candidate.affected_entity_ids)
        ext_entities = set(existing.affected_entity_ids)
        
        if not cand_entities or not ext_entities:
            return False
            
        entity_intersection = cand_entities.intersection(ext_entities)
        entity_overlap = len(entity_intersection) / max(len(cand_entities), len(ext_entities))
        
        cand_mems = set(validation.supporting_memories)
        ext_mems = {ev.memory_id for ev in existing.evidence}
        if not ext_mems:
            ext_mems = set(existing.supporting_memory_ids)
            
        if not cand_mems or not ext_mems:
            return False
            
        mem_intersection = cand_mems.intersection(ext_mems)
        mem_overlap = len(mem_intersection) / max(len(cand_mems), len(ext_mems))
        
        return entity_overlap >= 0.5 and mem_overlap >= 0.3

    def _map_confidence(self, score: float) -> str:
        from insight.domain.insight import InsightConfidence
        if score >= 0.85: return InsightConfidence.HIGH
        elif score >= 0.70: return InsightConfidence.MEDIUM
        return InsightConfidence.LOW

    def _build_evidence(self, memory_id: str, conf_enum) -> InsightEvidence:
        return InsightEvidence(
            memory_id=memory_id,
            fragment_id="pending",
            knowledge_object_id="pending",
            capture_id="pending",
            confidence=conf_enum,
            reason="Validated by Consolidation Engine"
        )

    def _build_new_insight(self, user_id: str, candidate: InsightCandidate, validation: InsightValidationResult, timestamp: str) -> Insight:
        conf_enum = self._map_confidence(validation.confidence)
        
        evidence = [self._build_evidence(m_id, conf_enum) for m_id in validation.supporting_memories]
        
        return Insight(
            id=str(uuid.uuid4()),
            user_id=user_id,
            status=InsightStatus.ACTIVE,
            type=candidate.candidate_type,
            title=validation.updated_title,
            description=validation.updated_description,
            confidence=conf_enum,
            importance=5, # Default medium importance
            supporting_memory_ids=validation.supporting_memories,
            evidence=evidence,
            affected_entity_ids=candidate.affected_entity_ids,
            created_at=timestamp,
            updated_at=timestamp,
            version=1
        )
