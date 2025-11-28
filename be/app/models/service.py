from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


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


class ServiceBase(BaseModel):
    name: str
    price: float = Field(..., ge=0)
    bid: str  # references BUSSINESS._id
    description: Optional[str] = None
    features: Optional[List[str]] = None
    short_description: Optional[str] = None
    metadata: Optional[dict] = None  # tourist_entry: add externalid; cab: add vehicle type

    @field_validator("bid")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    bid: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    short_description: Optional[str] = None
    metadata: Optional[dict] = None

    @field_validator("bid")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class ServiceInDB(ServiceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Service(ServiceBase):
    id: str

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
