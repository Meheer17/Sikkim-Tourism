from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.message_service import message_service
from app.models.message import Message, MessageCreate

router = APIRouter()


@router.get("/", response_model=List[Message])
async def list_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    uid: Optional[str] = Query(None, description="Filter by USER._id"),
    cid: Optional[str] = Query(None, description="Filter by COMMUNITY._id"),
    q: Optional[str] = Query(None, description="Search message text (case-insensitive substring)"),
    current_user_id: str = Depends(get_current_user_id),
):
    """List messages (pagination, filter by user or community)"""
    messages = await message_service.get_all(skip, limit, uid, cid, q)
    return messages


@router.post("/", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """Create a message (must be member of the community)"""
    # Enforce that the current user is the sender
    message = await message_service.create(message_data, current_user_id)
    return message


@router.put("/{message_id}", response_model=Message)
async def update_message(message_id: str, message_data: MessageCreate, current_user_id: str = Depends(get_current_user_id)):
    """Update a message. Can be done by message owner or community owner."""
    # message_data.text contains the new text; ignore incoming uid/cid for security
    updated = await message_service.update(message_id, message_data.text, current_user_id)
    return updated


@router.delete("/{message_id}")
async def delete_message(message_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Delete a message. Can be done by message owner or community owner."""
    result = await message_service.delete(message_id, current_user_id)
    if result:
        return {"message": "Message deleted successfully"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete message")
