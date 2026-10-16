"""
Unit Tests for AI Response Caching.
"""

import time
import pytest
from app.ai.cache import AICache


@pytest.mark.anyio
async def test_cache_deterministic_key():
    code = "def add(a, b):\n    return a + b\n"
    error = "ZeroDivisionError: division by zero"
    model = "gemini-2.5-flash"

    k1 = AICache.compute_cache_key(code, error, model, language="python")
    k2 = AICache.compute_cache_key(code + "  ", error + "\n", model, language="python")
    # Normalized whitespace should yield identical keys
    assert k1 == k2

    k3 = AICache.compute_cache_key(code, "Different Error", model, language="python")
    assert k1 != k3


@pytest.mark.anyio
async def test_cache_set_get_and_hit():
    cache = AICache(ttl_seconds=60, max_entries=10)
    key = "test-key-1"
    data = {"explanation": "Division by zero", "fix": "check b != 0"}

    # Initial miss
    val = await cache.get(key)
    assert val is None
    assert cache.stats["misses"] == 1
    assert cache.stats["hits"] == 0

    # Set and hit
    await cache.set(key, data)
    val2 = await cache.get(key)
    assert val2 == data
    assert cache.stats["hits"] == 1


@pytest.mark.anyio
async def test_cache_ttl_expiration():
    cache = AICache(ttl_seconds=1, max_entries=10)
    key = "expiring-key"
    await cache.set(key, {"value": 123})

    # Wait for TTL to elapse
    time.sleep(1.1)
    val = await cache.get(key)
    assert val is None


@pytest.mark.anyio
async def test_cache_lru_eviction():
    cache = AICache(ttl_seconds=60, max_entries=2)
    await cache.set("k1", 1)
    await cache.set("k2", 2)
    # Access k1 to make k2 the least recently used
    assert await cache.get("k1") == 1

    # Insert k3, which should evict k2
    await cache.set("k3", 3)
    assert await cache.get("k1") == 1
    assert await cache.get("k3") == 3
    assert await cache.get("k2") is None
