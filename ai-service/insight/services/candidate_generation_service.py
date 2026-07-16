"""
candidate_generation_service.py
===============================
Deterministic heuristic engine to group Memories into Insight Candidates.
This service uses purely deterministic pattern matching—no LLM logic.
"""

from typing import List, Dict, Tuple, Set
import uuid
import datetime
import itertools

from memory.domain.memory import Memory, MemoryType, MemoryStatus
from insight.domain.insight import InsightType
from insight.domain.candidate import InsightCandidate, CandidateStatus

class CandidateGenerationService:
    """
    Analyzes active memories and groups them deterministically into candidates.
    """

    def generate_candidates(self, user_id: str, memories: List[Memory]) -> List[InsightCandidate]:
        """
        Main entry point for candidate generation.
        Only processes memories that are ACTIVE.
        """
        active_memories = [m for m in memories if m.status == MemoryStatus.ACTIVE]
        
        candidates: List[InsightCandidate] = []
        
        candidates.extend(self._detect_relationships(active_memories))
        candidates.extend(self._detect_goal_progress(active_memories))
        candidates.extend(self._detect_habits(active_memories))
        candidates.extend(self._detect_trends(active_memories))
        candidates.extend(self._detect_contradictions(active_memories))
        candidates.extend(self._detect_opportunities(active_memories))
        
        # Prevent duplicates by merging candidates with same type and entities
        merged = self._merge_duplicates(candidates)
        return merged

    def _score(self, memory_count: int, time_span_days: int, entity_density: float) -> float:
        """Deterministic scoring normalized to [0.0, 1.0]."""
        mem_score = min(memory_count / 5.0, 1.0) * 0.5
        time_score = min(time_span_days / 30.0, 1.0) * 0.3
        ent_score = min(entity_density, 1.0) * 0.2
        return min(mem_score + time_score + ent_score, 1.0)

    def _calculate_timespan(self, memory_list: List[Memory]) -> int:
        """Calculate the days between the oldest and newest memory in a group."""
        if not memory_list:
            return 0
        try:
            dates = [datetime.datetime.fromisoformat(m.created_at.replace('Z', '+00:00')) for m in memory_list]
            delta = max(dates) - min(dates)
            return delta.days
        except Exception:
            return 0

    def _group_by_exact_entities(self, memory_list: List[Memory]) -> Dict[Tuple[str, ...], List[Memory]]:
        """Groups memories by their exact sorted tuple of entity_ids."""
        groups = {}
        for m in memory_list:
            if not m.entity_ids:
                continue
            key = tuple(sorted(m.entity_ids))
            if key not in groups:
                groups[key] = []
            groups[key].append(m)
        return groups

    def _detect_relationships(self, memories: List[Memory]) -> List[InsightCandidate]:
        relational_mems = [m for m in memories if m.memory_type == MemoryType.RELATIONAL]
        groups = self._group_by_exact_entities(relational_mems)
        
        results = []
        for entities, group in groups.items():
            if len(group) >= 3:
                span = self._calculate_timespan(group)
                score = self._score(len(group), span, 1.0)
                
                results.append(InsightCandidate(
                    id=str(uuid.uuid4()),
                    candidate_type=InsightType.RELATIONSHIP,
                    title="Recurring Relationship Interactions",
                    description=f"Identified {len(group)} relational memories sharing the same entities.",
                    supporting_memory_ids=[m.id for m in group],
                    affected_entity_ids=list(entities),
                    candidate_score=score,
                    pattern_metadata={"memory_count": len(group), "time_span_days": span},
                    generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
        return results

    def _detect_goal_progress(self, memories: List[Memory]) -> List[InsightCandidate]:
        goal_mems = [m for m in memories if m.memory_type == MemoryType.GOAL]
        groups = self._group_by_exact_entities(goal_mems)
        
        results = []
        for entities, group in groups.items():
            if len(group) >= 2:
                span = self._calculate_timespan(group)
                score = self._score(len(group), span, 1.0)
                
                results.append(InsightCandidate(
                    id=str(uuid.uuid4()),
                    candidate_type=InsightType.GOAL_PROGRESS,
                    title="Goal Progression Activity",
                    description=f"Identified {len(group)} goal-oriented memories sharing the same entities.",
                    supporting_memory_ids=[m.id for m in group],
                    affected_entity_ids=list(entities),
                    candidate_score=score,
                    pattern_metadata={"memory_count": len(group), "time_span_days": span},
                    generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
        return results

    def _detect_trends(self, memories: List[Memory]) -> List[InsightCandidate]:
        target_mems = [m for m in memories if m.memory_type in (MemoryType.PROJECT, MemoryType.SEMANTIC)]
        groups = self._group_by_exact_entities(target_mems)
        
        results = []
        for entities, group in groups.items():
            span = self._calculate_timespan(group)
            if len(group) >= 3 and span > 7:
                score = self._score(len(group), span, 1.0)
                
                results.append(InsightCandidate(
                    id=str(uuid.uuid4()),
                    candidate_type=InsightType.TREND,
                    title="Emerging Long-Term Trend",
                    description=f"Identified {len(group)} semantic/project memories spanning {span} days.",
                    supporting_memory_ids=[m.id for m in group],
                    affected_entity_ids=list(entities),
                    candidate_score=score,
                    pattern_metadata={"memory_count": len(group), "time_span_days": span},
                    generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
        return results

    def _detect_habits(self, memories: List[Memory]) -> List[InsightCandidate]:
        episodic_mems = [m for m in memories if m.memory_type == MemoryType.EPISODIC]
        groups = self._group_by_exact_entities(episodic_mems)
        
        results = []
        for entities, group in groups.items():
            span = self._calculate_timespan(group)
            if len(group) >= 4 and span <= 14:
                score = self._score(len(group), span, 1.0)
                
                results.append(InsightCandidate(
                    id=str(uuid.uuid4()),
                    candidate_type=InsightType.HABIT,
                    title="Dense Episodic Habit Pattern",
                    description=f"Identified {len(group)} episodic memories clustered within {span} days.",
                    supporting_memory_ids=[m.id for m in group],
                    affected_entity_ids=list(entities),
                    candidate_score=score,
                    pattern_metadata={"memory_count": len(group), "time_span_days": span},
                    generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
        return results

    def _detect_contradictions(self, memories: List[Memory]) -> List[InsightCandidate]:
        semantic_mems = [m for m in memories if m.memory_type == MemoryType.SEMANTIC]
        groups = self._group_by_exact_entities(semantic_mems)
        
        results = []
        for entities, group in groups.items():
            if len(group) >= 2:
                span = self._calculate_timespan(group)
                if span > 30:
                    score = self._score(len(group), span, 1.0)
                    
                    results.append(InsightCandidate(
                        id=str(uuid.uuid4()),
                        candidate_type=InsightType.CONTRADICTION,
                        title="Potential Semantic Shift",
                        description=f"Identified semantic memories spaced {span} days apart, flagging for contradiction check.",
                        supporting_memory_ids=[m.id for m in group],
                        affected_entity_ids=list(entities),
                        candidate_score=score,
                        pattern_metadata={"memory_count": len(group), "time_span_days": span},
                        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                    ))
        return results

    def _detect_opportunities(self, memories: List[Memory]) -> List[InsightCandidate]:
        # Count pairwise co-occurrences of entities across all active memories
        co_occurrences: Dict[Tuple[str, str], List[Memory]] = {}
        for m in memories:
            if len(m.entity_ids) >= 2:
                # all pairs in this memory
                pairs = itertools.combinations(sorted(m.entity_ids), 2)
                for pair in pairs:
                    if pair not in co_occurrences:
                        co_occurrences[pair] = []
                    co_occurrences[pair].append(m)
        
        results = []
        for pair, group in co_occurrences.items():
            if len(group) >= 3:
                span = self._calculate_timespan(group)
                score = self._score(len(group), span, 0.8) # density a bit lower as it's a pair
                
                results.append(InsightCandidate(
                    id=str(uuid.uuid4()),
                    candidate_type=InsightType.OPPORTUNITY,
                    title="High Frequency Co-occurrence Opportunity",
                    description=f"Entities {pair[0]} and {pair[1]} appeared together in {len(group)} memories.",
                    supporting_memory_ids=list(set(m.id for m in group)),
                    affected_entity_ids=list(pair),
                    candidate_score=score,
                    pattern_metadata={"memory_count": len(group), "time_span_days": span},
                    generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                ))
        return results

    def _merge_duplicates(self, candidates: List[InsightCandidate]) -> List[InsightCandidate]:
        """
        If two candidates have the exact same InsightType and exact same affected_entity_ids, merge them.
        """
        grouped = {}
        for c in candidates:
            key = (c.candidate_type.value, tuple(sorted(c.affected_entity_ids)))
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(c)
            
        merged_list = []
        for key, duplicate_list in grouped.items():
            if len(duplicate_list) == 1:
                merged_list.append(duplicate_list[0])
            else:
                # Merge logic: union of memory IDs, highest score
                best_candidate = max(duplicate_list, key=lambda c: c.candidate_score)
                all_mem_ids = set()
                for d in duplicate_list:
                    all_mem_ids.update(d.supporting_memory_ids)
                
                best_candidate.supporting_memory_ids = list(all_mem_ids)
                merged_list.append(best_candidate)
                
        return merged_list
