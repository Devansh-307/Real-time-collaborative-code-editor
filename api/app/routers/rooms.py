"""
Room and Template Management Router.
Handles room creation, validation, join checks, and template discovery.
"""

from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, HTTPException, status

from app.schemas.room import (
    LanguageInfo,
    RoomCreateRequest,
    RoomCreateResponse,
    RoomJoinRequest,
    RoomJoinResponse
)
from app.services.room_service import (
    create_room_files,
    generate_room_id,
    get_language_info,
    get_supported_languages,
    get_template
)
from app.utils.validators import sanitize_room_id, validate_room_id

router = APIRouter(prefix="/api", tags=["Rooms"])


@router.post("/rooms/create", response_model=RoomCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_room(request: RoomCreateRequest):
    """
    Create a new collaborative room with generated 8-char room ID and template files.
    """
    room_id = request.custom_room_id.strip() if request.custom_room_id else generate_room_id()
    
    if not validate_room_id(room_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid room ID format: '{room_id}'. Room ID must be in format ABCD-1234 or alphanumeric."
        )

    clean_room_id = sanitize_room_id(room_id)
    language = request.language.lower().strip()
    
    # Generate starter files for room
    starter_files = create_room_files(language)
    
    return RoomCreateResponse(
        room_id=clean_room_id,
        language=language,
        created_at=datetime.now(timezone.utc).isoformat(),
        files=starter_files
    )


@router.post("/rooms/join", response_model=RoomJoinResponse)
async def join_room(request: RoomJoinRequest):
    """
    Validate a room ID format for a user requesting to join.
    """
    if not validate_room_id(request.room_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid room ID. Please provide a valid 8-character room code (e.g. ABCD-1234)."
        )

    clean_room_id = sanitize_room_id(request.room_id)
    return RoomJoinResponse(
        room_id=clean_room_id,
        valid=True,
        message=f"Room {clean_room_id} is valid and ready for collaboration."
    )


@router.get("/languages", response_model=List[LanguageInfo])
async def list_languages():
    """
    List all supported programming languages, compiler specs, and capabilities.
    """
    return get_supported_languages()


@router.get("/templates/{language}", response_model=Dict[str, str])
async def get_language_template(language: str):
    """
    Get starter code files for a given language template.
    """
    info = get_language_info(language)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for language '{language}' not found."
        )
    return get_template(language)
