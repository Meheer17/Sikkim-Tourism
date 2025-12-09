from pydantic import BaseModel, EmailStr, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Literal, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class UserRole(str, Enum):
    user = "user"
    organiser = "organiser"
    business = "business"
    admin = "admin"


class LastSyncedAt(BaseModel):
    x: Optional[str] = None
    y: Optional[str] = None


class Secret(BaseModel):
    token: Optional[str] = None
    expiry: Optional[datetime] = None


class UserBase(BaseModel):
    name: str = Field(..., max_length=255)
    address: str
    gender: Optional[str] = None
    email: EmailStr
    role: Optional[UserRole] = UserRole.user
    approved: Optional[bool] = False


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    approved: Optional[bool] = None


class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str  # Can be encrypted
    address: str  # Can be encrypted
    gender: Optional[str] = None
    email: str  # Can be encrypted (EmailStr validation removed)
    role: Optional[UserRole] = UserRole.user
    approved: Optional[bool] = False
    hashed_password: str  # Can be encrypted
    userhash: Optional[str] = None
    last_synced_at: Optional[LastSyncedAt] = None
    secret: Optional[Secret] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class User(BaseModel):
    id: str
    name: str
    address: str
    gender: Optional[str] = None
    email: EmailStr
    role: Optional[UserRole] = UserRole.user
    approved: Optional[bool] = False
    last_synced_at: Optional[LastSyncedAt] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
