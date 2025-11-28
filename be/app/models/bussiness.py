from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum
import re

from app.models.location import Position


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class BussinessTypeEnum(str, Enum):
    tourist_entry = "tourist_entry"
    hotel = "hotel"
    restaurant = "restaurant"
    cab = "cab"
    guide = "guide"
    event = "event"


class BussinessCategoryEnum(str, Enum):
    event = "event"
    book = "book"
    buy = "buy"


class OpenHours(BaseModel):
    start: str  # HH:MM 24-hour format
    end: str    # HH:MM 24-hour format

    @field_validator("start", "end")
    @classmethod
    def validate_time_format(cls, v):
        if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError("Time must be in HH:MM 24-hour format")
        return v


# BUSSINESS_TYPE model
class BussinessTypeBase(BaseModel):
    type: BussinessTypeEnum
    category: BussinessCategoryEnum


class BussinessTypeCreate(BussinessTypeBase):
    pass


class BussinessTypeInDB(BussinessTypeBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class BussinessType(BussinessTypeBase):
    id: str

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


# BUSSINESS model
class BussinessBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: str = Field(..., max_length=255)
    open_hours: OpenHours
    type_id: str  # references BUSSINESS_TYPE._id
    l_id: str     # references LOCATION._id
    scheduled_at: datetime  # ISO 8601

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class BussinessCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: str = Field(..., max_length=255)
    open_hours: OpenHours
    type_id: str  # references BUSSINESS_TYPE._id
    l_id: Optional[str] = None  # references LOCATION._id, optional
    position: Position  # position for location if l_id not provided
    scheduled_at: datetime  # ISO 8601

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class BussinessUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    open_hours: Optional[OpenHours] = None
    type_id: Optional[str] = None
    l_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None

    @field_validator("type_id", "l_id")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class BussinessInDB(BussinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Bussiness(BussinessBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
