"""
Deterministic Mock LLM Provider for offline testing, CI/CD, and demonstrations.
Produces accurate, schema-compliant JSON responses for common bugs without requiring network access.
"""

import json
import time
import asyncio
from typing import AsyncIterator, Optional, Dict, Any
from app.ai.providers.base import LLMProvider, LLMResponse


class MockProvider(LLMProvider):
    """
    Mock provider that returns realistic error explanations and diff fixes.
    """

    def __init__(self, model_name: str = "mock-model", api_key: Optional[str] = "mock-key"):
        super().__init__(model_name=model_name, api_key=api_key)
        self.preset_response: Optional[str] = None
        self.call_history = []

    def set_preset_response(self, response_text: str):
        """Set an exact response to return on the next call (useful in unit tests)."""
        self.preset_response = response_text

    def _generate_synthetic_fix(self, prompt: str) -> Dict[str, Any]:
        """
        Analyzes prompt contents to construct a plausible fix.
        """
        prompt_lower = prompt.lower()

        # 1. Zero Division
        if "zerodivisionerror" in prompt_lower or "/ 0" in prompt:
            return {
                "explanation": "The program attempted to divide a number by zero, which is mathematically undefined and raises a ZeroDivisionError at runtime.",
                "error_type": "ZeroDivisionError",
                "suggested_action": "Add a guard condition to verify the denominator is non-zero before dividing.",
                "fix": {
                    "original_snippet": "result = a / b",
                    "fixed_snippet": "result = a / b if b != 0 else 0",
                    "start_line": 2,
                    "end_line": 2,
                    "explanation_of_change": "Added non-zero ternary check to prevent zero division.",
                    "full_fixed_code": "# Fixed code with non-zero check\ndef divide(a, b):\n    return a / b if b != 0 else 0\n"
                }
            }

        # 2. Index Error
        if "indexerror" in prompt_lower or "out of range" in prompt_lower:
            return {
                "explanation": "The code attempted to access a list index that is greater than or equal to the length of the list, resulting in an IndexError.",
                "error_type": "IndexError",
                "suggested_action": "Check the bounds of the collection or use safe indexing before retrieving elements.",
                "fix": {
                    "original_snippet": "item = arr[10]",
                    "fixed_snippet": "item = arr[10] if len(arr) > 10 else None",
                    "start_line": 3,
                    "end_line": 3,
                    "explanation_of_change": "Guarded list lookup with length check.",
                    "full_fixed_code": "# Fixed code with safe bounds check\narr = [1, 2, 3]\nitem = arr[10] if len(arr) > 10 else None\n"
                }
            }

        # 3. Missing Semicolon / Syntax Error (C++ / JS)
        if "expected ';'" in prompt_lower or "syntaxerror" in prompt_lower:
            return {
                "explanation": "A syntax error was encountered due to a missing statement terminator or punctuation symbol.",
                "error_type": "SyntaxError",
                "suggested_action": "Check preceding lines for missing colons, semicolons, or unmatched closing braces.",
                "fix": {
                    "original_snippet": "const x = 10",
                    "fixed_snippet": "const x = 10;",
                    "start_line": 1,
                    "end_line": 1,
                    "explanation_of_change": "Added required semicolon.",
                    "full_fixed_code": "const x = 10;\nconsole.log(x);\n"
                }
            }

        # 4. Generic Default Plausible Fix
        return {
            "explanation": "The program terminated unexpectedly during execution due to an unhandled exception in the primary execution block.",
            "error_type": "RuntimeError",
            "suggested_action": "Inspect variable assignments and ensure type contracts are respected.",
            "fix": {
                "original_snippet": "# problematic logic",
                "fixed_snippet": "# corrected logic",
                "start_line": 1,
                "end_line": 1,
                "explanation_of_change": "Resolved unhandled runtime exception.",
                "full_fixed_code": "# Corrected execution\nprint('Execution successful')\n"
            }
        }

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048,
        response_mime_type: Optional[str] = None
    ) -> LLMResponse:
        t_start = time.perf_counter()
        self.call_history.append({"prompt": prompt, "system_prompt": system_prompt})

        if self.preset_response:
            content = self.preset_response
            self.preset_response = None
        else:
            fix_dict = self._generate_synthetic_fix(prompt)
            content = json.dumps(fix_dict, indent=2)

        elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
        # Approximate tokens as len(content) // 4
        p_tokens = len(prompt) // 4
        c_tokens = len(content) // 4

        return LLMResponse(
            content=content,
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            model=self.model_name,
            latency_ms=elapsed_ms
        )

    async def stream_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048
    ) -> AsyncIterator[str]:
        self.call_history.append({"prompt": prompt, "system_prompt": system_prompt})
        text = self.preset_response or "Hello! I am your CodeSync AI Pair Programmer. How can I assist you with your code?"
        words = text.split(" ")
        for word in words:
            yield word + " "
            await asyncio.sleep(0.01)
