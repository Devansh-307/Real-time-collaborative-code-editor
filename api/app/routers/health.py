"""
Health Check Router.
Provides service readiness and liveness diagnostic probes.
"""

from fastapi import APIRouter
from app.config import settings
from app.services.docker_service import docker_service

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Perform a health check on the API and its connection to the Docker sandbox.
    """
    docker_ok = docker_service.is_docker_available()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docker_sandbox": "connected" if docker_ok else "unavailable (subprocess fallback enabled)"
    }
