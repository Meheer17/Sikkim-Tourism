from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId
from enum import Enum


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class FileType(str, Enum):
    glb = "glb"
    image = "image"
    audio = "audio"
    video = "video"


class FileBase(BaseModel):
    name: str = Field(..., max_length=512)
    message_id: str  # references MESSAGE._id
    size: int = Field(..., gt=0)
    metadata: dict

    @field_validator("message_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class FileCreate(FileBase):
    pass


class FileInDB(FileBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class File(FileBase):
    id: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
