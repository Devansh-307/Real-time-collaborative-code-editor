"""
CodeSync Backend Configuration Module.
Loads configuration from environment variables with strong typing and default fallbacks.
"""

from typing import List, Optional
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeSync API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080,http://127.0.0.1:5173,*"
    
    # Sandboxed Execution Security Limits
    EXECUTION_TIMEOUT_SECONDS: int = 5
    MAX_EXECUTION_TIMEOUT_SECONDS: int = 15
    MAX_SOURCE_SIZE_BYTES: int = 102400       # 100 KB
    MAX_STDIN_SIZE_BYTES: int = 65536         # 64 KB
    MAX_OUTPUT_LENGTH: int = 65536            # 64 KB max stdout/stderr response
    MAX_FILE_COUNT: int = 30
    
    # Docker Sandbox Limits
    CONTAINER_MEMORY_LIMIT: str = "256m"
    CONTAINER_SWAP_LIMIT: str = "256m"
    CONTAINER_CPU_QUOTA: float = 1.0
    CONTAINER_PIDS_LIMIT: int = 64
    
    # Runner Docker Image Names
    RUNNER_IMAGES: dict = {
        "python": "codesync-runner-python:latest",
        "python3": "codesync-runner-python:latest",
        "javascript": "codesync-runner-javascript:latest",
        "node": "codesync-runner-javascript:latest",
        "cpp": "codesync-runner-cpp:latest",
        "c++": "codesync-runner-cpp:latest",
        "java": "codesync-runner-java:latest"
    }

    # AI Pair Programmer Settings
    AI_PROVIDER: str = "gemini"               # gemini | openai | mock
    AI_MODEL: str = "gemini-2.5-flash"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    AI_RATE_LIMIT_PER_MINUTE: int = 20        # Max requests per room per minute
    AI_CACHE_TTL_SECONDS: int = 3600          # 1 hour response cache TTL
    AI_MAX_CACHE_ENTRIES: int = 500
    AI_MAX_CODE_CHARS: int = 12000            # Max characters before truncation kicks in
    AI_MAX_OUTPUT_CHARS: int = 4000           # Max stdout/stderr chars sent to prompt

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or "*" in self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"
    )


settings = Settings()
