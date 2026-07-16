"""
question_analysis_service.py
============================
Stage 1 of the Memory Retrieval Pipeline.
Analyzes the user's question to extract structured intent, entities, and constraints.
"""

import os
import json
import logging
import google.genai as genai
from google.genai import types as genai_types
from memory.retrieval.retrieval_models import QuestionAnalysis

logger = logging.getLogger(__name__)

class QuestionAnalysisService:
    """Analyzes a question using Gemini to produce a structured QuestionAnalysis object."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model_name = "gemini-2.5-flash"

    def analyze(self, question: str) -> QuestionAnalysis:
        """Extract structured constraints from the user's question."""
        logger.info(f"Analyzing question: '{question}'")
        
        prompt = f"""
You are the Memory Engine Question Analyzer.
Analyze the following user question and extract structured constraints for searching their memories.

QUESTION:
{question}

Provide your answer ONLY in the requested JSON format.
- 'intent' should be the type of question (e.g., LEARNING, REFLECTION, RECALL, PROJECT_STATUS).
- 'entities' should be a list of key subjects/people/topics mentioned.
- 'temporal_constraints' should be 'ALL' if no specific time is mentioned, or the specific time phrase.
- 'memory_types' can include EPISODIC, SEMANTIC, RELATIONAL, PROJECT, or GOAL.
- 'keywords' should be a few crucial search terms.
"""
        if not self.client:
            # For testing purposes or fallback, return a default analysis if no client
            logger.warning("No Gemini client found, returning generic question analysis.")
            return QuestionAnalysis(
                intent="RECALL",
                entities=[],
                temporal_constraints="ALL",
                memory_types=[],
                keywords=[]
            )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=QuestionAnalysis,
                    temperature=0.1
                ),
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
                
            return QuestionAnalysis(**json.loads(response.text))
        except Exception as e:
            logger.error(f"Failed to analyze question: {e}")
            # Degrade gracefully
            return QuestionAnalysis(
                intent="RECALL",
                entities=[],
                temporal_constraints="ALL",
                memory_types=[],
                keywords=[]
            )
