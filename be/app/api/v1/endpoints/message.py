from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id, get_current_admin_user
from app.services.message_service import message_service
from app.models.message import Message, MessageCreate, MessageWithUser

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


@router.get("/chat/{cid}", response_model=List[MessageWithUser])
async def get_chat_messages(
    cid: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id),
):
    """Get chat messages for a community with user details"""
    messages = await message_service.get_all_with_users(skip=skip, limit=limit, cid=cid)
    return messages


@router.get("/online/{cid}")
async def get_online_count(
    cid: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """Get approximate online user count for a community"""
    count = await message_service.get_online_count(cid)
    return {"online_count": count}


@router.post("/", response_model=MessageWithUser, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """Create a message (auto-joins community if not a member)"""
    message = await message_service.create(message_data, current_user_id)
    return message


@router.post("/{message_id}/flag", response_model=Message)
async def flag_message(
    message_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """Flag a message for admin review"""
    message = await message_service.flag_message(message_id, current_user_id)
    return message


@router.get("/flagged", response_model=List[MessageWithUser])
async def get_flagged_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    admin_user_id: str = Depends(get_current_admin_user),
):
    """Get all flagged messages for admin review (admin only)"""
    messages = await message_service.get_flagged_messages(skip, limit)
    return messages


@router.post("/{message_id}/moderate", response_model=Message)
async def moderate_message(
    message_id: str,
    action: str = Query(..., description="Action: hide, restore, or delete"),
    admin_user_id: str = Depends(get_current_admin_user),
):
    """Admin moderation: hide, restore, or delete a message"""
    message = await message_service.moderate_message(message_id, admin_user_id, action)
    return message


@router.put("/{message_id}", response_model=Message)
async def update_message(message_id: str, message_data: MessageCreate, current_user_id: str = Depends(get_current_user_id)):
    """Update a message. Can be done by message owner or community owner."""
    updated = await message_service.update(message_id, message_data.text, current_user_id)
    return updated


@router.delete("/{message_id}")
async def delete_message(message_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Delete a message. Can be done by message owner or community owner."""
    result = await message_service.delete(message_id, current_user_id)
    if result:
        return {"message": "Message deleted successfully"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to delete message")
