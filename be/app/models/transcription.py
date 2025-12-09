from pydantic import BaseModel, Field, field_validator, BeforeValidator, ConfigDict
from typing import Optional, Annotated, List
from datetime import datetime
from bson import ObjectId


def validate_object_id(v):
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid objectid")
    return ObjectId(v)


PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]


class TranscriptionBase(BaseModel):
    file_id: str
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    text: str
    avg_confidence: Optional[float] = None
    lang: Optional[str] = None


class TranscriptionCreate(TranscriptionBase):
    pass


class TranscriptionInDB(TranscriptionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    file_id: PyObjectId
    embedding: Optional[List[float]] = None
    raw_small: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class Transcription(TranscriptionBase):
    id: str
    file_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
