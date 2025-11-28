from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query

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
    current_user_id: str = Depends(get_current_user_id)
):
    """List messages (pagination, filter by user or community)"""
    messages = await message_service.get_all(skip, limit, uid, cid)
    return messages


@router.post("/", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a message"""
    message = await message_service.create(message_data)
    return message
