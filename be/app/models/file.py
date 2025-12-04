from pydantic import BaseModel, Field, field_validator, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ],
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class FileType(str, Enum):
    audio = "audio"
    video = "video"
    image = "image"
    model = "model"


class File(BaseModel):
    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}
    
    file_name: str
    file_path: str
    file_id: str
    file_type: FileType
    l_id: PyObjectId

    @field_validator("l_id")
    @classmethod
    def validate_object_id(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Must be a valid ObjectId")
        return v


class FileInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}
    
    file_name: str
    file_path: str
    file_type: str
    l_id: Optional[PyObjectId] = None
    uploaded_by: Optional[PyObjectId] = None
    cdn_response: Optional[dict] = None
    created_at: Optional[datetime] = None
    size: Optional[int] = None
