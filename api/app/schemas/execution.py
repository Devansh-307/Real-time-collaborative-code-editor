"""
Pydantic Schemas for Code Execution Requests and Results.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class SourceFile(BaseModel):
    name: str = Field(..., description="File name (e.g. main.py)")
    content: str = Field(..., description="Full source code text")


class ExecutionRequest(BaseModel):
    language: str = Field(..., description="Target runtime language (python, javascript, cpp, java)")
    files: List[SourceFile] = Field(..., description="List of source files in the project workspace")
    entry_file: Optional[str] = Field(default=None, description="Primary execution file to run")
    stdin: Optional[str] = Field(default="", description="Standard input text stream provided to process")
    timeout_seconds: Optional[int] = Field(default=5, ge=1, le=15, description="Timeout in seconds (1-15s)")


class ExecutionResponse(BaseModel):
    stdout: str = Field(default="", description="Standard output from process")
    stderr: str = Field(default="", description="Standard error from process or compiler")
    exit_code: int = Field(default=0, description="Process exit return code (0 = success)")
    elapsed_ms: float = Field(default=0.0, description="Total execution time in milliseconds")
    timed_out: bool = Field(default=False, description="Whether execution was terminated due to timeout")
    status: str = Field(default="completed", description="Execution status: 'completed', 'timeout', 'error'")
