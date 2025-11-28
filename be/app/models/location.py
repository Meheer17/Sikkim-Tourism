from pydantic import BaseModel, Field
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


class LocationType(str, Enum):
    emergency = "emergency"
    localhelp = "localhelp"
    bussiness = "bussiness"
    event = "event"
    tourism = "tourism"
    other = "other"


class Position(BaseModel):
    x: float
    y: float


class LocationBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: str = Field(..., max_length=255)
    position: Position
    metadata: dict
    type: LocationType


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    position: Optional[Position] = None
    metadata: Optional[dict] = None
    type: Optional[LocationType] = None


class LocationInDB(LocationBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Location(LocationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
