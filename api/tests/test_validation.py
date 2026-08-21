"""
Unit and Integration Tests for Validation and API Endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.execution import SourceFile
from app.utils.validators import (
    validate_room_id,
    validate_filename,
    validate_execution_payload
)

client = TestClient(app)


class TestValidators:
    def test_valid_room_ids(self):
        assert validate_room_id("ABCD-1234") is True
        assert validate_room_id("WXYZ-9876") is True
        assert validate_room_id("my-room-123") is True
        assert validate_room_id("dev_session") is True

    def test_invalid_room_ids(self):
        assert validate_room_id("") is False
        assert validate_room_id("ab") is False  # Too short
        assert validate_room_id("../hack") is False  # Path traversal
        assert validate_room_id("room with spaces") is False
        assert validate_room_id("special*&^%$#@!") is False

    def test_valid_filenames(self):
        valid, _ = validate_filename("main.py")
        assert valid is True
        valid, _ = validate_filename("App.test.js")
        assert valid is True
        valid, _ = validate_filename("header_utils.cpp")
        assert valid is True

    def test_invalid_filenames(self):
        valid, err = validate_filename("")
        assert valid is False
        assert "empty" in err.lower()

        valid, err = validate_filename("../../etc/passwd")
        assert valid is False
        assert "traversal" in err.lower()

        valid, err = validate_filename("folder/subfile.py")
        assert valid is False
        assert "traversal" in err.lower()

    def test_execution_payload_validation(self):
        # Valid python payload
        valid, _ = validate_execution_payload(
            language="python",
            files=[SourceFile(name="main.py", content="print('hello')")],
            timeout_seconds=5
        )
        assert valid is True

        # Invalid language
        valid, err = validate_execution_payload(
            language="unsupported_lang_xyz",
            files=[SourceFile(name="main.xyz", content="code")],
        )
        assert valid is False
        assert "unsupported" in err.lower()

        # Oversized payload (> 100 KB)
        huge_code = "x = 1\n" * 25000  # ~150 KB
        valid, err = validate_execution_payload(
            language="python",
            files=[SourceFile(name="main.py", content=huge_code)],
        )
        assert valid is False
        assert "exceeds maximum limit" in err.lower()

        # Timeout limits
        valid, err = validate_execution_payload(
            language="python",
            files=[SourceFile(name="main.py", content="print(1)")],
            timeout_seconds=999
        )
        assert valid is False
        assert "timeout" in err.lower()


class TestApiEndpoints:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "docker_sandbox" in data

    def test_create_room(self):
        response = client.post("/api/rooms/create", json={"language": "python"})
        assert response.status_code == 201
        data = response.json()
        assert "room_id" in data
        assert "-" in data["room_id"]
        assert len(data["files"]) > 0
        assert data["files"][0]["name"] == "main.py"

    def test_join_room_valid(self):
        response = client.post("/api/rooms/join", json={"room_id": "TEST-1234", "username": "Alice"})
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["room_id"] == "TEST-1234"

    def test_join_room_invalid(self):
        response = client.post("/api/rooms/join", json={"room_id": "invalid room name with spaces!!", "username": "Bob"})
        assert response.status_code == 400

    def test_list_languages(self):
        response = client.get("/api/languages")
        assert response.status_code == 200
        languages = response.json()
        assert len(languages) >= 5
        lang_ids = [l["id"] for l in languages]
        assert "python" in lang_ids
        assert "javascript" in lang_ids
        assert "cpp" in lang_ids
        assert "java" in lang_ids

    def test_get_template(self):
        response = client.get("/api/templates/python")
        assert response.status_code == 200
        data = response.json()
        assert "main.py" in data
