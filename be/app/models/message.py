from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class MessageStatus(str, Enum):
    active = "active"
    flagged = "flagged"  # Flagged by users for review
    hidden = "hidden"    # Hidden by admin
    deleted = "deleted"  # Soft deleted


class MessageBase(BaseModel):
    cid: str  # references COMMUNITY._id
    text: str

    @field_validator("cid")
    @classmethod
    def validate_cid(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid Community ObjectId")
        return v

    @field_validator("text")
    @classmethod
    def validate_text(cls, v):
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Text cannot be empty or whitespace")
        if len(v) > 1000:
            raise ValueError("Text too long (max 1000 characters)")
        return v


class MessageCreate(MessageBase):
    pass


class MessageInDB(MessageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uid: PyObjectId  # references USER._id
    cid: PyObjectId  # references COMMUNITY._id
    status: MessageStatus = MessageStatus.active
    flagged_by: list = Field(default_factory=list)  # List of user IDs who flagged
    flagged_count: int = 0
    moderated_by: Optional[PyObjectId] = None  # Admin who moderated
    moderated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Message(MessageBase):
    id: str
    uid: str
    status: MessageStatus = MessageStatus.active
    flagged_count: int = 0
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


class MessageWithUser(Message):
    """Message with user details for display"""
    user_name: str = ""
    user_avatar: str = ""  # Initials

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
