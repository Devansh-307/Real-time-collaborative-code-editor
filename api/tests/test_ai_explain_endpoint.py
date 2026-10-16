"""
Integration Tests for /ai/explain-error Endpoint.
Tests request validation, response serialization, caching, and rate limiting.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.providers.factory import set_llm_provider
from app.ai.providers.mock_provider import MockProvider
from app.ai.cache import ai_cache
from app.ai.rate_limiter import rate_limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_mock_provider():
    """Ensure MockProvider is used across all test cases and caches are reset."""
    mock = MockProvider()
    set_llm_provider(mock)
    rate_limiter.reset_room("test-room")
    rate_limiter.reset_room("rate-limit-room")
    yield mock
    set_llm_provider(None)


def test_explain_error_endpoint_success():
    payload = {
        "code": "def divide(a, b):\n    return a / b\n\nprint(divide(10, 0))",
        "language": "python",
        "stdout": "",
        "stderr": 'File "main.py", line 2, in divide\n    return a / b\nZeroDivisionError: division by zero',
        "exit_code": 1,
        "file_name": "main.py",
        "room_id": "test-room"
    }

    response = client.post("/ai/explain-error", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert "explanation" in data
    assert "error_type" in data
    assert data["error_type"] == "ZeroDivisionError"
    assert "fix" in data
    assert "original_snippet" in data["fix"]
    assert "fixed_snippet" in data["fix"]
    assert "full_fixed_code" in data["fix"]
    assert data["cached"] is False
    assert data["latency_ms"] >= 0


def test_explain_error_api_prefix_route():
    """Verify /api/ai/explain-error works identically for gateway compatibility."""
    payload = {
        "code": "const x = 10",
        "language": "javascript",
        "stderr": "SyntaxError: Unexpected token",
        "exit_code": 1,
        "room_id": "test-room"
    }
    response = client.post("/api/ai/explain-error", json=payload)
    assert response.status_code == 200
    assert response.json()["error_type"] == "SyntaxError"


def test_explain_error_caching():
    payload = {
        "code": "arr = [1, 2, 3]\nprint(arr[10])",
        "language": "python",
        "stderr": "IndexError: list index out of range",
        "exit_code": 1,
        "room_id": "test-room"
    }

    # First request: Cache miss
    resp1 = client.post("/ai/explain-error", json=payload)
    assert resp1.status_code == 200
    assert resp1.json()["cached"] is False

    # Second request: Cache hit
    resp2 = client.post("/ai/explain-error", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["cached"] is True
    assert resp2.json()["error_type"] == resp1.json()["error_type"]


def test_explain_error_rate_limiting():
    # Lower room limit for test
    rate_limiter.max_requests = 2
    room = "rate-limit-room"

    payload = {
        "code": "x = 1 / 0",
        "language": "python",
        "stderr": "ZeroDivisionError",
        "exit_code": 1,
        "room_id": room
    }

    # Request 1 & 2 pass
    r1 = client.post("/ai/explain-error", json=payload)
    assert r1.status_code == 200

    payload["code"] = "x = 2 / 0" # Avoid cache
    r2 = client.post("/ai/explain-error", json=payload)
    assert r2.status_code == 200

    # Request 3 should be 429
    payload["code"] = "x = 3 / 0"
    r3 = client.post("/ai/explain-error", json=payload)
    assert r3.status_code == 429
    assert "rate limit reached" in r3.json()["detail"].lower()
    assert "Retry-After" in r3.headers

    # Reset default
    rate_limiter.max_requests = 20
