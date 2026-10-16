"""
LLM Provider Factory.
Instantiates and manages the active LLMProvider singleton based on configuration.
"""

import os
import logging
from typing import Optional
from app.config import settings
from app.ai.providers.base import LLMProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.mock_provider import MockProvider
from app.ai.providers.openai_provider import OpenAIProvider

logger = logging.getLogger("codesync.ai.factory")

_active_provider: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    """
    Returns the active LLMProvider singleton based on AI_PROVIDER environment setting.
    """
    global _active_provider
    if _active_provider is not None:
        return _active_provider

    provider_name = (settings.AI_PROVIDER or "gemini").lower().strip()
    model_name = settings.AI_MODEL or "gemini-2.5-flash"
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if provider_name == "mock":
        logger.info(f"Initializing Mock LLM Provider (model: {model_name})")
        _active_provider = MockProvider(model_name=model_name)
    elif provider_name == "openai":
        logger.info(f"Initializing OpenAI LLM Provider (model: {model_name})")
        _active_provider = OpenAIProvider(model_name=model_name, api_key=settings.OPENAI_API_KEY)
    elif provider_name == "gemini":
        if not gemini_key:
            # If no Gemini key is provided, log warning and use MockProvider so app does not crash
            logger.warning("No GEMINI_API_KEY detected. Falling back to MockProvider for offline operation.")
            _active_provider = MockProvider(model_name=f"mock-{model_name}")
        else:
            logger.info(f"Initializing Gemini LLM Provider (model: {model_name})")
            _active_provider = GeminiProvider(model_name=model_name, api_key=gemini_key)
    else:
        logger.warning(f"Unknown AI_PROVIDER '{provider_name}'. Defaulting to MockProvider.")
        _active_provider = MockProvider(model_name=model_name)

    return _active_provider


def set_llm_provider(provider: Optional[LLMProvider]):
    """
    Overrides the active provider instance (essential for pytest fixtures).
    """
    global _active_provider
    _active_provider = provider
