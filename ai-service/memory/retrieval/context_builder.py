"""
context_builder.py
==================
Stage 5 of the Memory Retrieval Pipeline.
Builds a structured RetrievalContext from ranked memories and retrieved evidence.
"""

from typing import List
from memory.retrieval.retrieval_models import RankedMemory, RetrievedEvidence, RetrievalContext

class ContextBuilder:
    """Constructs the structured context passed to the final LLM."""

    def build_context(self, ranked_memories: List[RankedMemory], evidence_chain: List[RetrievedEvidence]) -> RetrievalContext:
        """
        Builds the context object.
        """
        context = RetrievalContext()
        
        # We limit to top 3-5 memories to keep context focused
        top_memories = [rm.memory for rm in ranked_memories[:5]]
        
        for mem in top_memories:
            context.memory_summaries.append(f"Title: {mem.title}\nSummary: {mem.summary}")
            
            # Add recent timeline points
            # Get last 3 points from this memory's timeline
            recent_points = mem.timeline[-3:] if mem.timeline else []
            for pt in recent_points:
                context.recent_timeline.append(f"[{mem.title}] {pt}")
                
            # Accumulate entities
            context.important_entities.extend(mem.entity_ids)

        # Deduplicate entities
        context.important_entities = list(set(context.important_entities))

        # Process evidence chain for observations and references
        for evidence in evidence_chain:
            # We only pull observations from the top knowledge objects to avoid context bloat
            for ko in evidence.knowledge_objects[:3]:
                for obs in ko.observations[:2]:  # Take top 2 observations per KO
                    context.supporting_observations.append(obs.description)
                
                context.evidence_references.append(f"Source Capture: {ko.provenance.capture_id} ({ko.provenance.capture_type.value})")
                context.recent_supporting_captures.append(ko.provenance.capture_id)

        # Deduplicate references
        context.evidence_references = list(set(context.evidence_references))
        context.recent_supporting_captures = list(set(context.recent_supporting_captures))

        return context
