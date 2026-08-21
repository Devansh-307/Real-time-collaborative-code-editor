"""
Input and Security Validators for CodeSync API.
Ensures room IDs, file names, language inputs, and payload sizes meet security limits.
"""

import re
from typing import List, Tuple
from app.config import settings
from app.schemas.execution import SourceFile

# Allowed room ID patterns: standard "ABCD-1234" or 3-64 alphanumeric chars
ROOM_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$|^[A-Za-z0-9_-]{3,64}$")

# Safe filename regex: no path separators or traversal
SAFE_FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9_.\-]+$")

SUPPORTED_LANGUAGES = {
    "python", "python3",
    "javascript", "node", "js",
    "cpp", "c++",
    "java",
    "json",
    "html"
}

EXECUTABLE_LANGUAGES = {
    "python", "python3",
    "javascript", "node",
    "cpp", "c++",
    "java"
}


def validate_room_id(room_id: str) -> bool:
    """Check if room identifier conforms to allowed secure pattern."""
    if not room_id or not isinstance(room_id, str):
        return False
    return bool(ROOM_ID_PATTERN.match(room_id.strip()))


def sanitize_room_id(room_id: str) -> str:
    """Format and uppercase room ID."""
    return room_id.strip().upper()


def validate_filename(filename: str) -> Tuple[bool, str]:
    """
    Validate that filename is safe from directory traversal and invalid characters.
    """
    if not filename or not isinstance(filename, str):
        return False, "Filename cannot be empty"
    
    clean_name = filename.strip()
    if len(clean_name) > 100:
        return False, "Filename exceeds 100 character limit"
    
    if ".." in clean_name or "/" in clean_name or "\\" in clean_name:
        return False, "Path traversal elements ('..', '/', '\\') are prohibited"
        
    if not SAFE_FILENAME_PATTERN.match(clean_name):
        return False, "Filename contains invalid characters"

    return True, ""


def validate_execution_payload(
    language: str,
    files: List[SourceFile],
    stdin: str = "",
    timeout_seconds: int = 5
) -> Tuple[bool, str]:
    """
    Perform deep validation on code execution request to prevent DOS and resource abuse.
    """
    norm_lang = language.strip().lower()
    if norm_lang not in EXECUTABLE_LANGUAGES:
        return False, f"Unsupported execution language: '{language}'. Supported: {', '.join(sorted(EXECUTABLE_LANGUAGES))}"
    
    if not files or len(files) == 0:
        return False, "At least one source file is required for execution"
    
    if len(files) > settings.MAX_FILE_COUNT:
        return False, f"Too many files ({len(files)}). Maximum allowed is {settings.MAX_FILE_COUNT}"
    
    total_size = 0
    file_names = set()
    for file in files:
        is_valid_name, err = validate_filename(file.name)
        if not is_valid_name:
            return False, f"Invalid file '{file.name}': {err}"
        
        if file.name in file_names:
            return False, f"Duplicate filename detected: '{file.name}'"
        file_names.add(file.name)
        
        file_size = len(file.content.encode('utf-8'))
        total_size += file_size

    if total_size > settings.MAX_SOURCE_SIZE_BYTES:
        return False, f"Total source code size ({total_size} bytes) exceeds maximum limit of {settings.MAX_SOURCE_SIZE_BYTES} bytes (100 KB)"

    if stdin:
        stdin_size = len(stdin.encode('utf-8'))
        if stdin_size > settings.MAX_STDIN_SIZE_BYTES:
            return False, f"Standard input size ({stdin_size} bytes) exceeds maximum limit of {settings.MAX_STDIN_SIZE_BYTES} bytes (64 KB)"

    if timeout_seconds < 1 or timeout_seconds > settings.MAX_EXECUTION_TIMEOUT_SECONDS:
        return False, f"Timeout must be between 1 and {settings.MAX_EXECUTION_TIMEOUT_SECONDS} seconds"

    return True, ""
