from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CreateGroupResponse(BaseModel):
    group_id: str = Field(..., description="Server group identifier")
    code: str = Field(..., description="4-digit code to share")


class JoinGroupRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=4, description="4-digit group code")


class JoinGroupResponse(BaseModel):
    group_id: str
    code: str


class LocationUpdateRequest(BaseModel):
    lat: float
    lng: float


class MemberLocation(BaseModel):
    user_id: str
    name: Optional[str] = None
    initials: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    last_seen_at: Optional[datetime] = None


class MembersResponse(BaseModel):
    group_id: str
    members: List[MemberLocation]
