from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated, List
from datetime import datetime
from bson import ObjectId
import re

from app.models.location import Position


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class OpenHours(BaseModel):
    start: str  # HH:MM 24-hour format
    end: str    # HH:MM 24-hour format

    @field_validator("start", "end")
    @classmethod
    def validate_time_format(cls, v):
        if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError("Time must be in HH:MM 24-hour format")
        return v


# business_TYPE model
class businessTypeBase(BaseModel):
    type: str = Field(..., max_length=100, description="Business type name")
    category: str = Field(..., max_length=100, description="Business category")


class businessTypeCreate(businessTypeBase):
    pass


class businessTypeUpdate(BaseModel):
    type: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)


class businessTypeInDB(businessTypeBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class businessType(businessTypeBase):
    id: str

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


# business model
class businessBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: str = Field(..., max_length=255)
    open_hours: OpenHours
    type_id: str  
    l_id: str     
    scheduled_at: datetime  
    approved: bool = False

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class businessCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: str = Field(..., max_length=255)
    open_hours: OpenHours
    type_id: str  # references business_TYPE._id
    l_id: Optional[str] = None  # references LOCATION._id, optional
    position: Position  # position for location if l_id not provided
    scheduled_at: datetime  # ISO 8601

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class businessUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    open_hours: Optional[OpenHours] = None
    type_id: Optional[str] = None
    l_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    approved: Optional[bool] = None

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class businessInDB(businessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    type_id: PyObjectId  # references business_TYPE._id
    l_id: PyObjectId     # references LOCATION._id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class business(businessBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


# Nested models for dashboard/complete view
class ServiceInBusiness(BaseModel):
    id: str
    name: str
    price: float
    description: Optional[str] = None
    features: Optional[List[str]] = None
    short_description: Optional[str] = None
    metadata: Optional[dict] = None

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


class BusinessWithServices(BaseModel):
    id: str
    name: str
    description: str
    short_description: str
    open_hours: OpenHours
    type_id: str
    l_id: str
    scheduled_at: datetime
    approved: bool
    created_at: datetime
    updated_at: datetime
    services: List[ServiceInBusiness] = []  # nested services

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
