"""
Response Caching for CodeSync AI Endpoints.
Caches repeated error diagnoses and code fixes keyed by SHA-256 hash of (code, error, model).
"""

import time
import hashlib
import asyncio
from typing import Any, Dict, Optional, Tuple
from collections import OrderedDict
from app.config import settings


class AICache:
    """
    Thread-safe in-memory LRU cache with TTL expiration.
    Keyed by SHA-256(code + error + model + language).
    """

    def __init__(self, ttl_seconds: int = 3600, max_entries: int = 500):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: OrderedDict[str, Tuple[float, Any]] = OrderedDict()
        self._hits = 0
        self._misses = 0
        self._lock = asyncio.Lock()

    @staticmethod
    def compute_cache_key(
        code: str,
        error_text: str,
        model: str,
        language: str = "",
        extra_key: str = ""
    ) -> str:
        """
        Generates a deterministic SHA-256 hash key for the given inputs.
        Normalizes whitespace and line endings to maximize cache hit rates on identical issues.
        """
        normalized_code = "\n".join(line.rstrip() for line in code.strip().splitlines())
        normalized_error = "\n".join(line.rstrip() for line in error_text.strip().splitlines())
        payload = f"{model.lower()}::{language.lower()}::{normalized_code}::{normalized_error}::{extra_key}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def get(self, cache_key: str) -> Optional[Any]:
        """
        Retrieves cached response if present and not expired.
        """
        now = time.time()
        async with self._lock:
            if cache_key not in self._cache:
                self._misses += 1
                return None

            created_at, value = self._cache[cache_key]
            if now - created_at > self.ttl_seconds:
                # Expired
                del self._cache[cache_key]
                self._misses += 1
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(cache_key)
            self._hits += 1
            return value

    async def set(self, cache_key: str, value: Any):
        """
        Stores an item in the cache, evicting oldest item if max_entries is exceeded.
        """
        now = time.time()
        async with self._lock:
            if cache_key in self._cache:
                self._cache.move_to_end(cache_key)
            self._cache[cache_key] = (now, value)

            # Evict oldest if exceeding capacity
            while len(self._cache) > self.max_entries:
                self._cache.popitem(last=False)

    async def clear(self):
        """Clears all cached entries (useful in testing)."""
        async with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    @property
    def stats(self) -> Dict[str, Any]:
        """Returns cache telemetry stats."""
        total = self._hits + self._misses
        hit_ratio = round((self._hits / total) * 100, 2) if total > 0 else 0.0
        return {
            "size": len(self._cache),
            "max_size": self.max_entries,
            "ttl_seconds": self.ttl_seconds,
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio_percent": hit_ratio
        }


# Global AI cache instance
ai_cache = AICache(
    ttl_seconds=settings.AI_CACHE_TTL_SECONDS,
    max_entries=settings.AI_MAX_CACHE_ENTRIES
)
