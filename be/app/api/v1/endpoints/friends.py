from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user_id
from app.schemas.friends import (
    CreateGroupResponse,
    JoinGroupRequest,
    JoinGroupResponse,
    LocationUpdateRequest,
    MembersResponse,
    MemberLocation,
)
from app.services.friends_service import friends_service
from pydantic import BaseModel


class GroupInfoResponse(BaseModel):
    group_id: str
    code: str
    owner_id: str
    member_count: int
    created_at: str


class MessageResponse(BaseModel):
    message: str


router = APIRouter()


@router.post("/groups", response_model=CreateGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(current_user_id: str = Depends(get_current_user_id)):
    group_id, code = await friends_service.create_group(current_user_id)
    return CreateGroupResponse(group_id=group_id, code=code)


@router.post("/groups/join", response_model=JoinGroupResponse)
async def join_group(payload: JoinGroupRequest, current_user_id: str = Depends(get_current_user_id)):
    group_id, code = await friends_service.join_group(current_user_id, payload.code)
    return JoinGroupResponse(group_id=group_id, code=code)


@router.post("/groups/{group_id}/location", status_code=status.HTTP_204_NO_CONTENT)
async def update_location(group_id: str, body: LocationUpdateRequest, current_user_id: str = Depends(get_current_user_id)):
    await friends_service.upsert_location(group_id, current_user_id, body.lat, body.lng)
    return None


@router.get("/groups/{group_id}/members", response_model=MembersResponse)
async def get_members(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    members_raw = await friends_service.list_member_locations(group_id)
    members = [MemberLocation(**m) for m in members_raw]
    return MembersResponse(group_id=group_id, members=members)


@router.get("/groups/{group_id}", response_model=GroupInfoResponse)
async def get_group_info(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Get group information including owner"""
    try:
        info = await friends_service.get_group_info(group_id)
        return GroupInfoResponse(**info)
    except Exception as e:
        print(f"[ERROR] get_group_info failed: {e}")
        raise


@router.delete("/groups/{group_id}", response_model=MessageResponse)
async def disband_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Disband a group - only owner can do this"""
    await friends_service.disband_group(group_id, current_user_id)
    return MessageResponse(message="Group disbanded successfully")


@router.post("/groups/{group_id}/leave", response_model=MessageResponse)
async def leave_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Leave a group - any member can do this"""
    await friends_service.leave_group(group_id, current_user_id)
    return MessageResponse(message="Left group successfully")


class ValidateResponse(BaseModel):
    exists: bool


@router.get("/groups/{group_id}/validate", response_model=ValidateResponse)
async def validate_group(group_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Check if a group still exists"""
    exists = await friends_service.validate_group_exists(group_id)
    return ValidateResponse(exists=exists)
