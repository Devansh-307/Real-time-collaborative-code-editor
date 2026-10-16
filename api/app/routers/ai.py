"""
FastAPI Router for AI Pair Programmer Services.
Includes Error Explanation, Code Review, and Contextual Chat.
"""

import time
import logging
from fastapi import APIRouter, HTTPException, status, Response
from app.config import settings
from app.schemas.ai import ExplainErrorRequest, ExplainErrorResponse, CodeDiffFix
from app.ai.rate_limiter import rate_limiter
from app.ai.truncation import truncate_code, truncate_output
from app.ai.cache import ai_cache, AICache
from app.ai.prompt_loader import build_explain_error_prompt
from app.ai.providers.factory import get_llm_provider
from app.ai.json_utils import extract_json_from_llm

logger = logging.getLogger("codesync.ai.router")

router = APIRouter(tags=["AI Pair Programmer"])


@router.post("/ai/explain-error", response_model=ExplainErrorResponse)
@router.post("/api/ai/explain-error", response_model=ExplainErrorResponse, include_in_schema=False)
async def explain_error(request: ExplainErrorRequest, response: Response):
    """
    Analyzes failed sandbox execution output and source code.
    Returns plain-English explanation, classified error type, and a minimal diff fix.
    """
    t_start = time.perf_counter()
    room_id = request.room_id or "default"

    # 1. Enforce Per-Room Rate Limiting
    allowed, remaining, retry_after = await rate_limiter.check_rate_limit(room_id)
    if not allowed:
        logger.warning(f"Rate limit exceeded for room '{room_id}' (retry after {retry_after}s)")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI rate limit reached for room '{room_id}'. Please wait {retry_after} seconds before requesting another fix.",
            headers={"Retry-After": str(int(retry_after))}
        )

    # 2. Check Response Cache
    error_summary = (request.stderr or request.stdout or "").strip()
    cache_key = AICache.compute_cache_key(
        code=request.code,
        error_text=error_summary,
        model=settings.AI_MODEL,
        language=request.language,
        extra_key=str(request.exit_code)
    )

    cached_entry = await ai_cache.get(cache_key)
    if cached_entry:
        elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
        logger.info(
            f"[AI Cache Hit] room={room_id} lang={request.language} "
            f"latency={elapsed_ms}ms key={cache_key[:12]}"
        )
        cached_resp = ExplainErrorResponse(**cached_entry)
        cached_resp.cached = True
        cached_resp.latency_ms = elapsed_ms
        return cached_resp

    # 3. Context-Aware Input Truncation
    truncated_code, was_truncated, detected_line = truncate_code(
        code=request.code,
        error_text=error_summary,
        max_chars=settings.AI_MAX_CODE_CHARS
    )
    truncated_stdout = truncate_output(request.stdout or "")
    truncated_stderr = truncate_output(request.stderr or "")

    if was_truncated:
        logger.info(f"Oversized code payload truncated for room '{room_id}' (error line: {detected_line})")

    # 4. Build Guarded Versioned Prompt
    try:
        system_prompt, user_prompt = build_explain_error_prompt(
            code=truncated_code,
            language=request.language,
            stdout=truncated_stdout,
            stderr=truncated_stderr,
            exit_code=request.exit_code,
            file_name=request.file_name,
            prompt_version="explain_error_v1"
        )
    except Exception as e:
        logger.error(f"Failed to build explain-error prompt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prompt builder error: {str(e)}"
        )

    # 5. Query Active LLM Provider
    provider = get_llm_provider()
    try:
        llm_resp = await provider.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            response_mime_type="application/json"
        )
    except Exception as e:
        logger.error(f"LLM Provider invocation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI model service temporarily unavailable: {str(e)}"
        )

    # 6. Parse and Validate Output Schema
    try:
        parsed_data = extract_json_from_llm(llm_resp.content)
    except Exception as e:
        logger.error(f"Failed to parse LLM JSON output: {e}\nRaw output: {llm_resp.content[:300]}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI model returned invalid JSON format. Please retry."
        )

    # Extract or fallback on fields
    fix_data = parsed_data.get("fix", {})
    fix_obj = CodeDiffFix(
        original_snippet=fix_data.get("original_snippet", ""),
        fixed_snippet=fix_data.get("fixed_snippet", ""),
        start_line=fix_data.get("start_line", detected_line or 1),
        end_line=fix_data.get("end_line", detected_line or 1),
        explanation_of_change=fix_data.get("explanation_of_change", ""),
        full_fixed_code=fix_data.get("full_fixed_code", "")
    )

    elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
    response_obj = ExplainErrorResponse(
        explanation=parsed_data.get("explanation", "An execution error occurred in your code."),
        error_type=parsed_data.get("error_type", "RuntimeError"),
        fix=fix_obj,
        suggested_action=parsed_data.get("suggested_action", "Apply the suggested fix above to resolve the issue."),
        cached=False,
        model=llm_resp.model,
        latency_ms=elapsed_ms,
        tokens_used=llm_resp.total_tokens
    )

    # 7. Store in Response Cache
    await ai_cache.set(cache_key, response_obj.model_dump())

    # 8. Structured Telemetry Logging
    logger.info(
        f"[AI Explain] room={room_id} lang={request.language} "
        f"error={response_obj.error_type} latency={elapsed_ms}ms "
        f"tokens={response_obj.tokens_used} model={response_obj.model}"
    )

    return response_obj
