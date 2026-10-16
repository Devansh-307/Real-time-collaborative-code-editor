"""
Prompt Loader and Template Builder.
Loads versioned prompt files from backend/ai/prompts or api/app/ai/prompts,
applies containment guards, and prepares execution payloads for LLM providers.
"""

import os
from pathlib import Path
from typing import Dict, Tuple, Optional
from app.ai.guard import guard

# Potential directories where prompt templates reside
PROMPT_DIRS = [
    Path(__file__).parent / "prompts",
    Path(__file__).resolve().parents[3] / "backend" / "ai" / "prompts",
    Path(__file__).resolve().parents[3] / "api" / "app" / "ai" / "prompts",
    Path("backend/ai/prompts"),
    Path("api/app/ai/prompts"),
]

_PROMPT_CACHE: Dict[str, Tuple[str, str]] = {}


def find_prompt_file(prompt_name: str) -> Path:
    """
    Locates the versioned prompt file across known search paths.
    """
    filename = prompt_name if prompt_name.endswith(".txt") else f"{prompt_name}.txt"
    for directory in PROMPT_DIRS:
        candidate = directory / filename
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()
    raise FileNotFoundError(
        f"Prompt template '{filename}' not found in any search path: {[str(d) for d in PROMPT_DIRS]}"
    )


def load_prompt_template(prompt_name: str) -> Tuple[str, str]:
    """
    Loads and parses a versioned prompt into (system_prompt, user_template).
    Uses in-memory cache to avoid repeated disk reads.
    """
    if prompt_name in _PROMPT_CACHE:
        return _PROMPT_CACHE[prompt_name]

    filepath = find_prompt_file(prompt_name)
    content = filepath.read_text(encoding="utf-8")

    # Split on ### SYSTEM_PROMPT and ### USER_PROMPT headers
    system_part = ""
    user_part = ""

    if "### SYSTEM_PROMPT" in content and "### USER_PROMPT" in content:
        parts = content.split("### USER_PROMPT")
        system_part = parts[0].replace("### SYSTEM_PROMPT", "").strip()
        user_part = parts[1].strip()
    else:
        # Fallback if no delimiter
        user_part = content.strip()

    _PROMPT_CACHE[prompt_name] = (system_part, user_part)
    return system_part, user_part


def build_explain_error_prompt(
    code: str,
    language: str,
    stdout: str,
    stderr: str,
    exit_code: int,
    file_name: Optional[str] = None,
    prompt_version: str = "explain_error_v1"
) -> Tuple[str, str]:
    """
    Builds the full (system_prompt, user_prompt) pair for error explanation.
    Wraps all user data with prompt containment fences.
    """
    base_system, user_template = load_prompt_template(prompt_version)

    # Prepend security guardrails to system prompt
    full_system = f"{guard.get_guard_system_instruction()}\n\n{base_system}"

    # Wrap code and output safely
    wrapped_code = guard.wrap_code(code, language=language)
    wrapped_output = guard.wrap_output(stdout=stdout, stderr=stderr, exit_code=exit_code)

    user_prompt = user_template.format(
        language=language or "code",
        exit_code=exit_code,
        file_name=file_name or "main",
        wrapped_code=wrapped_code,
        wrapped_output=wrapped_output
    )

    return full_system, user_prompt
