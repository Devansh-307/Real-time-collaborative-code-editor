"""
CodeSync Backend Configuration Module.
Loads configuration from environment variables with strong typing and default fallbacks.
"""

from typing import List
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

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or "*" in self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
