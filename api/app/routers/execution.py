"""
Code Execution Router.
Receives user code payloads and executes them inside isolated Docker containers.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.execution import ExecutionRequest, ExecutionResponse
from app.services.execution_service import execution_service

router = APIRouter(prefix="/api", tags=["Execution"])


@router.post("/execute", response_model=ExecutionResponse)
def execute_code(request: ExecutionRequest):
    """
    Execute user source files in a hardened sandbox container.
    """
    try:
        result = execution_service.run_code(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal execution error: {str(e)}"
        )
