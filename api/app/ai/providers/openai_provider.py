"""
OpenAI LLM Provider Stub for CodeSync.
Demonstrates provider swappability via AI_PROVIDER=openai environment variable.
"""

import os
import time
import logging
from typing import AsyncIterator, Optional
from app.ai.providers.base import LLMProvider, LLMResponse

logger = logging.getLogger("codesync.ai.openai")


class OpenAIProvider(LLMProvider):
    """
    OpenAI provider integration stub (e.g. gpt-4o, gpt-4o-mini).
    """

    def __init__(self, model_name: str = "gpt-4o-mini", api_key: Optional[str] = None):
        super().__init__(model_name=model_name, api_key=api_key)
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048,
        response_mime_type: Optional[str] = None
    ) -> LLMResponse:
        t_start = time.perf_counter()
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")

        # Extensible integration hook for openai package
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=self.api_key)
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            resp = await client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_output_tokens
            )
            elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
            content = resp.choices[0].message.content or ""
            usage = resp.usage
            return LLMResponse(
                content=content,
                prompt_tokens=usage.prompt_tokens if usage else 0,
                completion_tokens=usage.completion_tokens if usage else 0,
                model=self.model_name,
                latency_ms=elapsed_ms
            )
        except ImportError:
            raise NotImplementedError(
                "openai package is not installed. Run `pip install openai` to use OpenAIProvider."
            )

    async def stream_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048
    ) -> AsyncIterator[str]:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=self.api_key)
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            stream = await client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_output_tokens,
                stream=True
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield delta
        except ImportError:
            raise NotImplementedError("openai package is not installed.")
