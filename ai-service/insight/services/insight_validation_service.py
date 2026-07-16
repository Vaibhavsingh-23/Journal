"""
insight_validation_service.py
=============================
Invokes Gemini to validate deterministic Insight Candidates.
Gemini acts STRICTLY as a validator and cannot invent facts.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

import google.generativeai as genai

from insight.domain.candidate import InsightCandidate
from memory.domain.memory import Memory
from insight.domain.validation import InsightValidationResult

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Raised when the validation process fails (e.g. LLM timeout or malformed output)."""
    pass

class InsightValidationService:
    """
    Evaluates an InsightCandidate by prompting Gemini to strictly verify evidence.
    """
    def __init__(self):
        # Configure Gemini using system env var
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
        # Using gemini-1.5-flash for speed/cost since this is a high-volume validation task
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def validate_candidate(self, candidate: InsightCandidate, memories: List[Memory]) -> InsightValidationResult:
        """
        Validates the candidate against its supporting memories.
        """
        try:
            # 1. Construct Evidence Payload
            memory_context = []
            for m in memories:
                memory_context.append({
                    "id": m.id,
                    "type": m.memory_type.value,
                    "title": m.title,
                    "summary": m.summary,
                    "timeline": m.timeline,
                    "date": m.created_at
                })

            # 2. Build Strict Prompt
            prompt = f"""
You are the Insight Validation Engine.
Your ONLY job is to evaluate a deterministic "Candidate Pattern" against a provided list of "Memories".
You must NOT invent evidence, extrapolate missing facts, or merge unrelated candidates.

CANDIDATE PATTERN:
Title: {candidate.title}
Type: {candidate.candidate_type.value}
Description: {candidate.description}
Candidate Score (Deterministic Strength): {candidate.candidate_score}

MEMORIES (EVIDENCE):
{json.dumps(memory_context, indent=2)}

INSTRUCTIONS:
1. Review the memories to see if they genuinely support the Candidate Pattern.
2. Determine if any memories explicitly contradict the pattern.
3. Calculate a semantic confidence score (0.0 to 1.0) for this pattern.
4. Improve the title and description to be highly readable, but stay strictly within the bounds of the provided evidence.

Respond ONLY with valid JSON in the following schema (no markdown blocks, just raw JSON):
{{
    "confidence": 0.85,
    "reasoning": "Explanation based strictly on evidence",
    "updated_title": "Human readable title",
    "updated_description": "Human readable description",
    "supporting_memory_ids": ["id1", "id2"],
    "contradicting_memory_ids": []
}}
"""
            # 3. Invoke LLM
            # Set response_mime_type to force JSON if supported by the SDK version, 
            # otherwise rely on the prompt constraint.
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            
            raw_json = response.text.strip()
            # Failsafe for markdown blocks if response_mime_type is ignored
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:-3].strip()
            elif raw_json.startswith("```"):
                raw_json = raw_json[3:-3].strip()

            result_dict = json.loads(raw_json)

            # 4. Apply Strict Decision Thresholds
            confidence = float(result_dict.get("confidence", 0.0))
            contradicting = result_dict.get("contradicting_memory_ids", [])
            
            approved = False
            final_reasoning = result_dict.get("reasoning", "")
            
            if len(contradicting) > 0:
                approved = False
                final_reasoning = "Rejected: Contradictory evidence detected."
            elif confidence < 0.50:
                approved = False
                final_reasoning = "Rejected: Weak evidence."
            elif confidence < 0.70:
                approved = False
                final_reasoning = "Held: Needs more evidence."
            else:
                approved = True

            # 5. Build Result
            return InsightValidationResult(
                candidate_id=candidate.id,
                approved=approved,
                confidence=confidence,
                reasoning=final_reasoning,
                updated_title=result_dict.get("updated_title", candidate.title),
                updated_description=result_dict.get("updated_description", candidate.description),
                supporting_memories=result_dict.get("supporting_memory_ids", []),
                contradicting_memories=contradicting,
                validation_timestamp=datetime.now(timezone.utc).isoformat()
            )

        except Exception as e:
            logger.error(f"InsightValidationService failed: {e}")
            raise ValidationError(f"LLM validation failed: {e}")
