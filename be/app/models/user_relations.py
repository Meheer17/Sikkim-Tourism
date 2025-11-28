from pydantic import BaseModel, Field, field_validator
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


class UserBussinessRole(str, Enum):
    owner = "owner"
    user = "user"


class UserCommunitiesRole(str, Enum):
    owner = "owner"
    member = "member"


# USER_BUSSINESS model
class UserBussinessBase(BaseModel):
    uid: str  # references USER._id
    bid: str  # references BUSSINESS._id
    role: UserBussinessRole

    @field_validator("uid", "bid")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class UserBussinessCreate(UserBussinessBase):
    pass


class UserBussinessInDB(UserBussinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserBussiness(UserBussinessBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# USER_COMMUNITIES model
class UserCommunitiesBase(BaseModel):
    uid: str  # references USER._id
    cid: str  # references COMMUNITY._id
    role: UserCommunitiesRole

    @field_validator("uid", "cid")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class UserCommunitiesCreate(UserCommunitiesBase):
    pass


class UserCommunitiesInDB(UserCommunitiesBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserCommunities(UserCommunitiesBase):
    id: str

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
