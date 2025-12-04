from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, List, Annotated, Dict, Any
from datetime import datetime
from bson import ObjectId


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class ServiceBase(BaseModel):
    name: str
    price: float = Field(..., ge=0)
    bid: str  # references business._id
    description: Optional[str] = None
    features: Optional[List[str]] = None
    short_description: Optional[str] = None
    # Metadata is a dynamic array of JSON objects. Each entry can be any JSON object.
    metadata: Optional[List[Dict[str, Any]]] = None  # tourist_entry: add externalid; cab: add vehicle type

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
    metadata: Optional[List[Dict[str, Any]]] = None

    @field_validator("bid")
    @classmethod
    def validate_object_id(cls, v):
        if v is not None and not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class ServiceInDB(ServiceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Service(ServiceBase):
    id: str

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
