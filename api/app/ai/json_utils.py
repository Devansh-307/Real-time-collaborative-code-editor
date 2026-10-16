"""
JSON Extraction and Sanitization Utilities for LLM Outputs.
Handles markdown fences, trailing commas, and raw string extraction.
"""

import re
import json
from typing import Any, Dict


def extract_json_from_llm(raw_text: str) -> Dict[str, Any]:
    """
    Extracts and parses JSON object from an LLM response string.
    Gracefully handles ```json markdown fences, leading/trailing conversational text,
    and returns a parsed Python dictionary.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response received from LLM")

    cleaned = raw_text.strip()

    # 1. Remove markdown fences if present
    # Pattern: ```json ... ``` or ``` ... ```
    fence_pattern = re.compile(r'```(?:json)?\s*([\s\S]*?)\s*```', re.IGNORECASE)
    match = fence_pattern.search(cleaned)
    if match:
        cleaned = match.group(1).strip()

    # 2. Try direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Locate the outermost { ... }
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_candidate = cleaned[first_brace:last_brace + 1]
        try:
            return json.loads(json_candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Unable to parse valid JSON from LLM output:\n{raw_text[:500]}")
