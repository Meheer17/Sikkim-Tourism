from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
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


class UserRole(str, Enum):
    user = "user"
    organiser = "organiser"
    bussiness = "bussiness"
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


class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    last_synced_at: Optional[LastSyncedAt] = None
    secret: Optional[Secret] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


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

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
