from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


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
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Message(MessageBase):
    id: str
    uid: str
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
