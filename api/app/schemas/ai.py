"""
Pydantic Schemas for AI Pair Programmer Service.
Defines strict data contracts for Error Explanation, Code Review, and Chat.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class CodeDiffFix(BaseModel):
    """
    Structured representation of a code fix.
    Can be represented as targeted lines replacement or full file text.
    """
    original_snippet: str = Field(..., description="The erroneous snippet of code")
    fixed_snippet: str = Field(..., description="The corrected snippet of code")
    start_line: Optional[int] = Field(default=None, description="1-based starting line number in source file")
    end_line: Optional[int] = Field(default=None, description="1-based ending line number in source file")
    explanation_of_change: Optional[str] = Field(default="", description="Why this exact change fixes the issue")
    full_fixed_code: Optional[str] = Field(default=None, description="Complete fixed source code for one-click application")


class ExplainErrorRequest(BaseModel):
    """
    Payload sent from client when an execution fails.
    """
    code: str = Field(..., description="The source code that was executed")
    language: str = Field(..., description="Target runtime language (python, javascript, cpp, java)")
    stdout: Optional[str] = Field(default="", description="Standard output from execution")
    stderr: Optional[str] = Field(default="", description="Standard error/compiler diagnostics from execution")
    exit_code: int = Field(default=1, description="Process exit code")
    file_name: Optional[str] = Field(default=None, description="Active file name (e.g., main.py)")
    room_id: Optional[str] = Field(default="default", description="Collaborative room identifier for rate limiting")


class ExplainErrorResponse(BaseModel):
    """
    Structured response returned to frontend client.
    """
    explanation: str = Field(..., description="Clear, plain-English explanation of why the code failed")
    error_type: str = Field(..., description="Classification of the error (e.g., IndexError, SyntaxError, SegmentationFault)")
    fix: CodeDiffFix = Field(..., description="Minimal targeted diff fix with replacement code")
    suggested_action: str = Field(..., description="Short one-line advice for the developer")
    cached: bool = Field(default=False, description="Whether the response was served from cache")
    model: str = Field(..., description="Model identifier used to produce the explanation")
    latency_ms: float = Field(default=0.0, description="End-to-end processing latency in milliseconds")
    tokens_used: int = Field(default=0, description="Total tokens consumed (prompt + completion)")
