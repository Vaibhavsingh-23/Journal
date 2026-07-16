"""
cognitive_orchestrator.py
=========================
Master orchestrator for the background cognitive pipeline.
Coordinates Capture, Memory Formation, and Insight Processing.
"""

import time
import logging
from typing import Optional

from capture.capture_pipeline import CapturePipeline, Capture, ResolutionError
from capture.services.extraction_service import ExtractionError
from memory.services.memory_formation_engine import MemoryFormationEngine
from insight.services.candidate_generation_service import CandidateGenerationService
from insight.services.insight_validation_service import InsightValidationService, ValidationError
from insight.services.insight_consolidation_service import InsightConsolidationService, ConsolidationError
from memory.repositories.memory_repository import MemoryRepository

logger = logging.getLogger(__name__)

class CognitiveOrchestrator:
    """
    Executes the cognitive pipeline sequentially in the background.
    Failure at any stage logs an error but preserves data from earlier stages.
    """
    def __init__(
        self,
        capture_pipeline: CapturePipeline,
        memory_engine: MemoryFormationEngine,
        memory_repo: MemoryRepository,
        candidate_gen: CandidateGenerationService,
        insight_val: InsightValidationService,
        insight_con: InsightConsolidationService
    ):
        self.capture_pipeline = capture_pipeline
        self.memory_engine = memory_engine
        self.memory_repo = memory_repo
        self.candidate_gen = candidate_gen
        self.insight_val = insight_val
        self.insight_con = insight_con

    def run_pipeline(self, entry_id: str, text: str, user_id: str, date: Optional[str] = None):
        """
        Executes the entire end-to-end cognitive pipeline asynchronously.
        """
        t0 = time.time()
        logger.info(f"CognitiveOrchestrator started for entry: {entry_id}")

        modified_memories = []

        # -------------------------------------------------------------------
        # Phase 1: Capture Pipeline
        # -------------------------------------------------------------------
        try:
            logger.info("Phase 1: Capture Pipeline started")
            capture = Capture(id=entry_id, text=text, user_id=user_id, timestamp=date)
            knowledge_object = self.capture_pipeline.process_capture(capture)
            logger.info(f"Phase 1: Capture Pipeline completed. KnowledgeObject: {knowledge_object.id}")
        except ExtractionError as e:
            logger.error(f"Phase 1 (Extraction) failed for entry {entry_id}: {e}")
            return
        except ResolutionError as e:
            logger.error(f"Phase 1 (Resolution) failed for entry {entry_id}: {e}")
            return
        except Exception as e:
            logger.error(f"Phase 1 (Capture) unexpected failure for entry {entry_id}: {e}")
            return

        # -------------------------------------------------------------------
        # Phase 2: Memory Formation
        # -------------------------------------------------------------------
        try:
            logger.info("Phase 2: Memory Formation started")
            # process_knowledge_object returns a list of modified memories
            modified_memories = self.memory_engine.process_knowledge_object(knowledge_object)
            
            # Dirty marking for Insights
            for memory in modified_memories:
                memory.pending_insight_generation = True
                self.memory_repo.update(memory)
                logger.info(f"Phase 2: Memory {memory.id} marked dirty for insights.")
                
            logger.info(f"Phase 2: Memory Formation completed. Memories affected: {len(modified_memories)}")
        except Exception as e:
            logger.error(f"Phase 2 (Memory Formation) failed for entry {entry_id}: {e}")
            return

        # -------------------------------------------------------------------
        # Phase 3: Insight Engine (Dirty Processing)
        # -------------------------------------------------------------------
        # We process all pending memories for this user, not just the ones created in this cycle,
        # acting as a deterministic retry mechanism.
        self.process_dirty_insights(user_id)

        t_total = time.time() - t0
        logger.info(f"CognitiveOrchestrator fully completed for entry {entry_id} in {t_total:.3f}s")

    def process_dirty_insights(self, user_id: str):
        """Processes all dirty memories for insight generation."""
        try:
            logger.info("Phase 3: Insight Engine processing started")
            dirty_memories = self._get_dirty_memories(user_id)
            if not dirty_memories:
                logger.info("Phase 3: No dirty memories found. Insight Engine skipping.")
                return

            logger.info(f"Phase 3: Found {len(dirty_memories)} dirty memories.")
            
            # 1. Candidate Generation (Deterministic)
            candidates = self.candidate_gen.generate_candidates(user_id, dirty_memories)
            logger.info(f"Phase 3: Candidate Generation produced {len(candidates)} candidates.")

            failed_memory_ids = set()

            # Process each candidate independently
            for candidate in candidates:
                try:
                    # 2. Validation (LLM Guard)
                    validation_result = self.insight_val.validate(candidate)
                    if not validation_result.approved:
                        logger.info(f"Phase 3: Candidate {candidate.id} rejected by LLM: {validation_result.reasoning}")
                        continue
                        
                    # 3. Consolidation (Lifecycle)
                    consolidation_result = self.insight_con.consolidate(user_id, candidate, validation_result)
                    logger.info(f"Phase 3: Candidate {candidate.id} consolidated. Action: {consolidation_result.action.value}")
                    
                except ValidationError as e:
                    logger.error(f"Phase 3 (Validation) failed for candidate {candidate.id}: {e}")
                    failed_memory_ids.update(candidate.supporting_memory_ids)
                except ConsolidationError as e:
                    logger.error(f"Phase 3 (Consolidation) failed for candidate {candidate.id}: {e}")
                    failed_memory_ids.update(candidate.supporting_memory_ids)
                except Exception as e:
                    logger.error(f"Phase 3 (Insight Processing) unexpected failure for candidate {candidate.id}: {e}")
                    failed_memory_ids.update(candidate.supporting_memory_ids)

            # Clear the dirty flags on the memories we processed successfully.
            # If a candidate failed validation/consolidation (e.g. Gemini timeout), 
            # the underlying memories remain dirty to be retried next cycle.
            for memory in dirty_memories:
                if memory.id not in failed_memory_ids:
                    memory.pending_insight_generation = False
                    self.memory_repo.update(memory)
                    logger.info(f"Phase 3: Cleared dirty flag for memory {memory.id}")

            logger.info("Phase 3: Insight Engine processing completed.")
            
        except Exception as e:
            logger.error(f"Phase 3 (Insight Engine) fatal orchestration failure: {e}")

    def _get_dirty_memories(self, user_id: str):
        """Fetch all memories for this user where pending_insight_generation == True."""
        all_memories = self.memory_repo.find_by_user(user_id)
        return [m for m in all_memories if getattr(m, 'pending_insight_generation', False)]
