"""
Per-Room Rate Limiter for AI Endpoints.
Prevents runaway LLM API costs by enforcing a sliding window request cap per collaborative room.
"""

import time
import asyncio
from typing import Dict, List
from collections import defaultdict
from app.config import settings


class RoomRateLimiter:
    """
    Sliding window in-memory rate limiter per room_id.
    """
    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._room_requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def check_rate_limit(self, room_id: str) -> tuple[bool, int, float]:
        """
        Check if a request is allowed for the given room_id.
        Returns:
            (allowed: bool, remaining_requests: int, retry_after_seconds: float)
        """
        now = time.time()
        room_key = room_id.strip() if room_id and room_id.strip() else "default"
        
        async with self._lock:
            # Purge timestamps outside sliding window
            cutoff = now - self.window_seconds
            timestamps = [ts for ts in self._room_requests[room_key] if ts > cutoff]
            
            if len(timestamps) >= self.max_requests:
                # Rate limit exceeded. Compute seconds until oldest timestamp drops out.
                oldest_timestamp = timestamps[0]
                retry_after = max(1.0, round(self.window_seconds - (now - oldest_timestamp), 1))
                self._room_requests[room_key] = timestamps
                return False, 0, retry_after

            # Allow request and append timestamp
            timestamps.append(now)
            self._room_requests[room_key] = timestamps
            remaining = self.max_requests - len(timestamps)
            return True, remaining, 0.0

    def reset_room(self, room_id: str):
        """Reset rate limit history for a room (useful in tests)."""
        room_key = room_id.strip() if room_id and room_id.strip() else "default"
        if room_key in self._room_requests:
            del self._room_requests[room_key]


# Global rate limiter instance
rate_limiter = RoomRateLimiter(
    max_requests=settings.AI_RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)
