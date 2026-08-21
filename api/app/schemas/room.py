"""
Pydantic Schemas for Room and Language Operations.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FileItem(BaseModel):
    id: str = Field(..., description="Unique file identifier")
    name: str = Field(..., description="Filename including extension")
    path: str = Field(..., description="Relative file path within project")
    content: str = Field(..., description="Initial source code content")
    is_entry: bool = Field(default=False, description="Whether this file is the main execution entrypoint")
    language: str = Field(..., description="Language identifier for Monaco editor")


class RoomCreateRequest(BaseModel):
    language: str = Field(default="python", description="Programming language for project template")
    name: Optional[str] = Field(default=None, description="Optional custom room title or description")
    custom_room_id: Optional[str] = Field(default=None, description="Optional custom 8-char room code")


class RoomCreateResponse(BaseModel):
    room_id: str = Field(..., description="Formatted room ID (e.g. ABCD-1234)")
    language: str = Field(..., description="Template language")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    files: List[FileItem] = Field(default_factory=list, description="Initial starter files for the project")


class RoomJoinRequest(BaseModel):
    room_id: str = Field(..., description="8-character room identifier")
    username: Optional[str] = Field(default=None, description="Collaborator display nickname")


class RoomJoinResponse(BaseModel):
    room_id: str = Field(..., description="Sanitized room identifier")
    valid: bool = Field(..., description="Whether the room code is valid format")
    message: str = Field(..., description="Status message or error")


class LanguageInfo(BaseModel):
    id: str
    label: str
    monaco_id: str
    extension: str
    entry_file: str
    version: str
    description: str
    command: str
    supports_execution: bool = True
    supports_preview: bool = False
