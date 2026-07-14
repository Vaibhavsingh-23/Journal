"""
capture_pipeline.py
===================
Orchestrator for the Capture Pipeline.

Purpose:
Coordinates the flow from raw Capture to synthesized Knowledge Object.
Orchestrates Extraction, Persistence, and Resolution.
"""

import time
import logging
from dataclasses import dataclass
from typing import Optional

from capture.domain.knowledge_object import KnowledgeObject, CaptureType
from capture.services.extraction_service import ExtractionService, ExtractionError
from capture.services.resolution_service import ResolutionService
from capture.repositories.knowledge_repository import KnowledgeRepository, RepositoryError

logger = logging.getLogger(__name__)

class ResolutionError(Exception):
    """Raised when the entity resolution phase fails."""
    pass

@dataclass
class Capture:
    """Input payload for the Capture Pipeline."""
    id: str
    text: str
    user_id: str
    capture_type: CaptureType = CaptureType.JOURNAL
    timestamp: Optional[str] = None

class CapturePipeline:
    """
    Main orchestrator for processing raw captures into Knowledge Objects.
    """

    def __init__(
        self,
        extraction_service: ExtractionService,
        resolution_service: ResolutionService,
        knowledge_repository: KnowledgeRepository
    ):
        self.extraction_service = extraction_service
        self.resolution_service = resolution_service
        self.knowledge_repository = knowledge_repository

    def process_capture(self, capture: Capture) -> KnowledgeObject:
        """
        Executes the full pipeline on a raw capture.
        
        Steps:
        1. Validate Capture
        2. Extract raw data
        3. Persist extracted Knowledge Object
        4. Resolve entities
        5. Persist resolved Knowledge Object
        6. Return final resolved Knowledge Object
        """
        t0 = time.time()
        logger.info(f"Capture received: {capture.id}")

        # 1. Validate
        if not capture.text or not capture.text.strip():
            raise ValueError("Capture text cannot be empty.")

        # 2. Extract
        logger.info(f"Extraction started for capture: {capture.id}")
        t_extract_start = time.time()
        
        # ExtractionError propagates up if extraction fails
        ko = self.extraction_service.extract(
            capture_id=capture.id,
            capture_text=capture.text,
            user_id=capture.user_id,
            capture_type=capture.capture_type,
            timestamp=capture.timestamp
        )
        
        t_extract = time.time() - t_extract_start
        logger.info(f"Extraction completed for capture: {capture.id} in {t_extract:.3f}s")

        # 3. Persist Extracted (Unresolved)
        t_persist1_start = time.time()
        
        # RepositoryError (e.g. DuplicateKeyError) propagates up if persistence fails
        self.knowledge_repository.save(ko)
        
        t_persist1 = time.time() - t_persist1_start
        logger.info(f"Persistence completed (initial) for capture: {capture.id} in {t_persist1:.3f}s")

        # 4. Resolve
        logger.info(f"Resolution started for knowledge object: {ko.id}")
        t_resolve_start = time.time()
        
        try:
            ko_resolved = self.resolution_service.resolve(ko)
        except Exception as e:
            # If resolution fails, keep original persisted KO, throw structured error
            raise ResolutionError(f"Entity resolution failed for capture {capture.id}: {e}")
            
        t_resolve = time.time() - t_resolve_start
        logger.info(f"Resolution completed for knowledge object: {ko.id} in {t_resolve:.3f}s")

        # 5. Persist Resolved
        t_persist2_start = time.time()
        self.knowledge_repository.update(ko_resolved)
        t_persist2 = time.time() - t_persist2_start
        logger.info(f"Persistence completed (update) for knowledge object: {ko.id} in {t_persist2:.3f}s")

        t_total = time.time() - t0
        logger.info(f"Pipeline completed for capture: {capture.id}. Total time: {t_total:.3f}s")

        # 6. Return
        return ko_resolved
