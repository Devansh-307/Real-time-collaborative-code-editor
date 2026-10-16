"""
Gemini LLM Provider implementation using official google-genai SDK.
Supports fast inference, structured outputs, and token streaming.
"""

import os
import time
import logging
from typing import AsyncIterator, Optional
from app.ai.providers.base import LLMProvider, LLMResponse

logger = logging.getLogger("codesync.ai.gemini")


class GeminiProvider(LLMProvider):
    """
    Google Gemini model integration (e.g., gemini-2.5-flash, gemini-2.0-flash).
    """

    def __init__(self, model_name: str = "gemini-2.5-flash", api_key: Optional[str] = None):
        super().__init__(model_name=model_name, api_key=api_key)
        resolved_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
        )
        self.api_key = resolved_key
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize google-genai client: {e}")

    def _ensure_client(self):
        if not self._client:
            if not self.api_key:
                raise ValueError(
                    "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in .env or switch to AI_PROVIDER=mock."
                )
            from google import genai
            self._client = genai.Client(api_key=self.api_key)

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048,
        response_mime_type: Optional[str] = None
    ) -> LLMResponse:
        self._ensure_client()
        from google.genai import types

        config_args = {
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }
        if system_prompt:
            config_args["system_instruction"] = system_prompt
        if response_mime_type:
            config_args["response_mime_type"] = response_mime_type

        config = types.GenerateContentConfig(**config_args)

        t_start = time.perf_counter()
        try:
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)

            text = response.text or ""
            prompt_tokens = 0
            completion_tokens = 0
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
                completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

            return LLMResponse(
                content=text,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                model=self.model_name,
                latency_ms=elapsed_ms
            )
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
            logger.error(f"Gemini API generation error ({elapsed_ms}ms): {e}")
            raise

    async def stream_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048
    ) -> AsyncIterator[str]:
        self._ensure_client()
        from google.genai import types

        config_args = {
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }
        if system_prompt:
            config_args["system_instruction"] = system_prompt

        config = types.GenerateContentConfig(**config_args)

        response_stream = await self._client.aio.models.generate_content_stream(
            model=self.model_name,
            contents=prompt,
            config=config
        )
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
