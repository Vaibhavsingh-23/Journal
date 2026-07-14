"""
extraction_service.py
=====================
Service for extracting raw observations and entities from captures using Gemini.

Purpose:
Responsible for analyzing raw text/data and outputting structured KnowledgeObjects.
Does not resolve entities or perform persistence.

Expected Future PRs:
- None for now. This PR implements the core extraction logic.
"""

import os
import json
import logging
from typing import List, Optional
from datetime import datetime

import google.genai as genai
from google.genai import types as genai_types
from pydantic import BaseModel, Field

from capture.domain.entity import Entity, EntityType
from capture.domain.observation import Observation, ObservationType, Perspective, Confidence
from capture.domain.knowledge_object import KnowledgeObject, Provenance, CaptureType

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal Pydantic Models for Gemini Structured Output
# ---------------------------------------------------------------------------

class LLMEntity(BaseModel):
    name: str = Field(..., description="The canonical name of the entity.")
    entity_type: EntityType = Field(..., description="The category of the entity.")
    confidence: Confidence = Field(..., description="Confidence in this extraction.")

class LLMObservation(BaseModel):
    type: ObservationType = Field(..., description="The type of the observation.")
    perspective: Perspective = Field(..., description="Whether explicitly stated, inferred, or external.")
    description: str = Field(..., description="Human-readable description. Must refer to explicit capture text unless INFERRED.")
    confidence: Confidence = Field(..., description="Confidence in this extraction.")

class LLMExtraction(BaseModel):
    summary: str = Field(..., description="Brief summary of the capture.")
    overall_confidence: Confidence = Field(..., description="Overall confidence in the extraction quality.")
    entities: List[LLMEntity] = Field(default_factory=list, description="List of recognized entities.")
    observations: List[LLMObservation] = Field(default_factory=list, description="List of extracted observations.")

# ---------------------------------------------------------------------------
# Extraction Service
# ---------------------------------------------------------------------------

class ExtractionError(Exception):
    """Exception raised for errors during extraction."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class ExtractionService:
    """Service handling the AI extraction phase of the pipeline using Gemini."""

    def __init__(self):
        # Allow injecting client for testing if needed, or instantiate default
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model_name = "gemini-2.5-flash"

    def extract(
        self, 
        capture_id: str, 
        capture_text: str, 
        user_id: str, 
        capture_type: CaptureType = CaptureType.JOURNAL,
        timestamp: str = None
    ) -> KnowledgeObject:
        """
        Extract raw entities and observations from the capture text.
        
        Args:
            capture_id: The ID of the source capture.
            capture_text: The raw input text.
            user_id: The ID of the user.
            capture_type: The type of capture.
            timestamp: The creation timestamp of the capture.
            
        Returns:
            KnowledgeObject: Structured output containing summary, entities, and observations.
            
        Raises:
            ExtractionError: If extraction fails after retries.
        """
        if not capture_text or not capture_text.strip():
            raise ExtractionError("Capture text cannot be empty.")
            
        if not timestamp:
            timestamp = datetime.utcnow().isoformat() + "Z"

        prompt = self._build_prompt(capture_text)

        # Attempt 1
        try:
            llm_result = self._call_gemini(prompt)
        except Exception as e:
            logger.warning(f"Extraction attempt 1 failed: {e}. Retrying once...")
            # Attempt 2 (Retry)
            try:
                llm_result = self._call_gemini(prompt)
            except Exception as retry_e:
                logger.error(f"Extraction attempt 2 failed: {retry_e}")
                raise ExtractionError("Failed to extract knowledge from capture after retries.", {"error": str(retry_e)})

        # Map to Domain Models
        return self._map_to_knowledge_object(
            llm_result, 
            capture_id, 
            capture_text, 
            user_id, 
            capture_type, 
            timestamp
        )

    def _build_prompt(self, capture_text: str) -> str:
        """Construct the prompt template for Gemini."""
        return f"""
You are the Knowledge Extraction Engine for a Second Brain system.
Your task is to extract structured knowledge from the provided capture text.

RULES:
1. Extract a concise Summary.
2. Extract Entities (People, Projects, Technologies, etc.). Do NOT resolve duplicates.
3. Extract Observations (State, Action, Emotion, Goal, Decision, Event, Relationship).
4. Observation descriptions MUST reflect information explicitly present in the text, unless marked as INFERRED.
5. Do NOT infer long-term memories, insights, recommendations, or identity changes. Focus strictly on what is in the text.
6. Provide confidence levels (LOW, MEDIUM, HIGH) for all extractions.

CAPTURE TEXT:
{capture_text}
"""

    def _call_gemini(self, prompt: str) -> LLMExtraction:
        """Calls Gemini API and enforces structured output validation."""
        if not self.client:
            raise RuntimeError("Gemini client not initialized (missing API key).")
            
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LLMExtraction,
                temperature=0.2, # Low temperature for more deterministic extraction
            ),
        )
        
        if not response.text:
            raise ValueError("Gemini returned empty response.")
            
        # Parse and validate using Pydantic (will raise ValidationError if malformed)
        raw_json = json.loads(response.text)
        return LLMExtraction(**raw_json)

    def _map_to_knowledge_object(
        self, 
        llm_result: LLMExtraction, 
        capture_id: str, 
        capture_text: str, 
        user_id: str, 
        capture_type: CaptureType, 
        timestamp: str
    ) -> KnowledgeObject:
        """Maps the intermediate LLM Pydantic model to the canonical Domain Models."""
        
        domain_entities = []
        entity_confidences = {}
        
        for idx, e in enumerate(llm_result.entities):
            # We do not assign canonical IDs yet. Using empty string per rules.
            domain_entity = Entity(
                id="", 
                name=e.name,
                entity_type=e.entity_type,
                aliases=[],
                user_id=user_id,
                created_at=timestamp,
                updated_at=timestamp
            )
            domain_entities.append(domain_entity)
            # Store confidence in metadata since Entity domain model lacks it
            entity_confidences[f"entity_{idx}_{e.name}"] = e.confidence.value

        domain_observations = []
        for idx, o in enumerate(llm_result.observations):
            domain_obs = Observation(
                id=f"obs_raw_{idx}", # Temporary ID for raw observation
                type=o.type,
                perspective=o.perspective,
                description=o.description,
                confidence=o.confidence,
                timestamp=timestamp
            )
            domain_observations.append(domain_obs)

        provenance = Provenance(
            capture_id=capture_id,
            capture_type=capture_type,
            source_uri=f"capture://{capture_type.value}/{capture_id}"
        )

        metadata = {
            "overall_confidence": llm_result.overall_confidence.value,
            "entity_confidences": entity_confidences,
            "extraction_model": self.model_name,
            "extraction_timestamp": datetime.utcnow().isoformat() + "Z"
        }

        return KnowledgeObject(
            id=f"ko_{capture_id}", # Generated temporary ID based on capture
            user_id=user_id,
            provenance=provenance,
            summary=llm_result.summary,
            entities=domain_entities,
            observations=domain_observations,
            metadata=metadata,
            created_at=timestamp
        )
