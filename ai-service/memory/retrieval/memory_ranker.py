"""
memory_ranker.py
================
Stage 3 of the Memory Retrieval Pipeline.
Deterministically ranks candidate memories based on their relevance to the QuestionAnalysis.
"""

from typing import List
from memory.domain.memory import Memory
from memory.retrieval.retrieval_models import QuestionAnalysis, RankedMemory

class MemoryRanker:
    """Ranks candidate memories without using LLM."""

    def rank(self, candidates: List[Memory], analysis: QuestionAnalysis) -> List[RankedMemory]:
        """
        Rank candidate memories deterministically.
        """
        ranked = []
        target_entities = set(analysis.entities)
        keywords_lower = [k.lower() for k in analysis.keywords]

        for mem in candidates:
            score = 0
            
            # Shared entities
            shared_entities = set(mem.entity_ids).intersection(target_entities)
            score += len(shared_entities) * 15
            
            # Keyword overlap in summary
            mem_summary_lower = mem.summary.lower()
            for kw in keywords_lower:
                if kw in mem_summary_lower:
                    score += 5
                    
            # Memory type match
            if mem.memory_type in analysis.memory_types:
                score += 10
                
            # Fragment count (depth/importance of memory)
            score += min(len(mem.fragment_ids), 10) * 2
            
            # (Recency could be added here if parsed from created_at/updated_at, 
            # but simple string comparison is brittle for ranking absolute recency.
            # Assuming active memories are inherently relevant.)

            ranked.append(RankedMemory(memory=mem, score=score))

        # Sort descending by score
        ranked.sort(key=lambda r: r.score, reverse=True)
        return ranked
