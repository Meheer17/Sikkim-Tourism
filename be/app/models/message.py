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
    uid: str  # references USER._id
    cid: str  # references COMMUNITY._id
    text: str

    @field_validator("uid", "cid")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
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
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
