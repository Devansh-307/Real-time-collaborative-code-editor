"""
Unit Tests for AI Per-Room Rate Limiter.
"""

import pytest
from app.ai.rate_limiter import RoomRateLimiter


@pytest.mark.anyio
async def test_rate_limiter_allows_under_limit():
    limiter = RoomRateLimiter(max_requests=3, window_seconds=60)
    room = "room-abc"

    allowed, rem, wait = await limiter.check_rate_limit(room)
    assert allowed is True
    assert rem == 2

    allowed, rem, wait = await limiter.check_rate_limit(room)
    assert allowed is True
    assert rem == 1

    allowed, rem, wait = await limiter.check_rate_limit(room)
    assert allowed is True
    assert rem == 0


@pytest.mark.anyio
async def test_rate_limiter_blocks_when_exceeded():
    limiter = RoomRateLimiter(max_requests=2, window_seconds=60)
    room = "room-test"

    await limiter.check_rate_limit(room)
    await limiter.check_rate_limit(room)

    # Third request should be blocked
    allowed, rem, wait = await limiter.check_rate_limit(room)
    assert allowed is False
    assert rem == 0
    assert wait > 0


@pytest.mark.anyio
async def test_rate_limiter_rooms_are_isolated():
    limiter = RoomRateLimiter(max_requests=1, window_seconds=60)

    # Room 1 reaches limit
    a1, _, _ = await limiter.check_rate_limit("room-1")
    assert a1 is True
    a2, _, _ = await limiter.check_rate_limit("room-1")
    assert a2 is False

    # Room 2 should still be allowed
    b1, _, _ = await limiter.check_rate_limit("room-2")
    assert b1 is True
