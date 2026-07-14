"""
idempotency.py
==============
Defines the idempotency strategy for the Capture Pipeline.

Purpose:
Ensures that processing the same Capture multiple times does not result in
duplicated Entities, Observations, or Knowledge Objects. Provides the interfaces
needed to verify if a Capture has already been successfully processed.

Expected Future PRs:
- Implementation using Redis or MongoDB for distributed idempotency locks.
"""

from typing import Protocol

class IdempotencyManager(Protocol):
    """Protocol defining the idempotency manager contract."""

    def is_processed(self, capture_id: str, pipeline_version: str) -> bool:
        """
        Check if the given capture has already been processed by this pipeline version.
        
        Args:
            capture_id: The unique identifier of the capture.
            pipeline_version: The version of the pipeline.
            
        Returns:
            True if already processed, False otherwise.
        """
        ...

    def mark_processed(self, capture_id: str, pipeline_version: str) -> None:
        """
        Mark a capture as successfully processed.
        
        Args:
            capture_id: The unique identifier of the capture.
            pipeline_version: The version of the pipeline.
        """
        ...
