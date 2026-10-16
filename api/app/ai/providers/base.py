"""
Abstract Base Class for LLM Providers.
Enables pluggable model backends (Gemini, OpenAI, Mock, Anthropic) via environment variables.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from pydantic import BaseModel, Field


class LLMResponse(BaseModel):
    """
    Standardized response returned by any LLM provider.
    """
    content: str = Field(..., description="Raw text or JSON content returned by model")
    prompt_tokens: int = Field(default=0, description="Tokens consumed by prompt")
    completion_tokens: int = Field(default=0, description="Tokens produced in generation")
    model: str = Field(..., description="Model identifier used for generation")
    latency_ms: float = Field(default=0.0, description="Generation duration in milliseconds")

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


class LLMProvider(ABC):
    """
    Interface definition for all LLM providers in CodeSync.
    """

    def __init__(self, model_name: str, api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048,
        response_mime_type: Optional[str] = None
    ) -> LLMResponse:
        """
        Executes a non-streaming completion call.
        """
        pass

    @abstractmethod
    async def stream_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = 2048
    ) -> AsyncIterator[str]:
        """
        Executes a streaming completion call yielding tokens asynchronously.
        """
        pass
