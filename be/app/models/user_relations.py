from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from datetime import datetime
from bson import ObjectId
from enum import Enum
from typing import Annotated


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class UserBusinessRole(str, Enum):
    owner = "owner"
    user = "user"


class UserCommunitiesRole(str, Enum):
    owner = "owner"
    member = "member"


# USER_BUSINESS model
class UserBusinessBase(BaseModel):
    uid: str  # references USER._id
    bid: str  # references business._id
    role: UserBusinessRole

    @field_validator("uid", "bid")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class UserBusinessCreate(UserBusinessBase):
    pass


class UserBusinessInDB(UserBusinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uid: PyObjectId  # references USER._id
    bid: PyObjectId  # references business._id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class UserBusiness(UserBusinessBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


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
    uid: PyObjectId  # references USER._id
    cid: PyObjectId  # references COMMUNITY._id

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class UserCommunities(UserCommunitiesBase):
    id: str

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
