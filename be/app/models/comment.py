from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class CommentBase(BaseModel):
    service_id: str
    text: str
    rating: Optional[int] = None

    @field_validator("service_id")
    @classmethod
    def validate_service_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid Service ObjectId")
        return v

    @field_validator("text")
    @classmethod
    def validate_text(cls, v):
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Text cannot be empty or whitespace")
        if len(v) > 1000:
            raise ValueError("Text too long (max 1000 characters)")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v is not None:
            if not isinstance(v, int) or v < 1 or v > 5:
                raise ValueError("Rating must be between 1 and 5")
        return v


class CommentCreate(CommentBase):
    pass


class CommentInDB(CommentBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    service_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Comment(CommentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})


class CommentWithUser(Comment):
    """Comment with user details for display"""
    user_name: str = ""
    user_avatar: str = ""

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
