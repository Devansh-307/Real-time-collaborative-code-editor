"""
Execution Orchestration Service.
Validates execution payload and dispatches tasks to the Docker sandbox.
"""

import logging
from app.schemas.execution import ExecutionRequest, ExecutionResponse
from app.services.docker_service import docker_service
from app.utils.validators import validate_execution_payload

logger = logging.getLogger("codesync.execution")


class ExecutionService:
    @staticmethod
    def run_code(request: ExecutionRequest) -> ExecutionResponse:
        """
        Validate and execute user-submitted source code in the sandbox.
        """
        # Validate limits, languages, and payloads
        is_valid, error_msg = validate_execution_payload(
            language=request.language,
            files=request.files,
            stdin=request.stdin or "",
            timeout_seconds=request.timeout_seconds or 5
        )

        if not is_valid:
            logger.warning(f"Execution validation failed: {error_msg}")
            return ExecutionResponse(
                stdout="",
                stderr=f"Validation Error: {error_msg}",
                exit_code=1,
                elapsed_ms=0.0,
                timed_out=False,
                status="error"
            )

        logger.info(f"Executing {request.language} with {len(request.files)} file(s), timeout={request.timeout_seconds}s")
        return docker_service.execute(
            language=request.language,
            files=request.files,
            entry_file=request.entry_file,
            stdin=request.stdin or "",
            timeout_seconds=request.timeout_seconds or 5
        )


execution_service = ExecutionService()
