from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.file import FileType


class FileUploadResponse(BaseModel):
    file_name: str
    file_path: str
    file_id: str
    file_type: FileType
    l_id: str


class FileMetadata(BaseModel):
    id: str = Field(alias="_id")
    file_name: str
    file_path: str
    file_id: str
    file_type: FileType
    l_id: str
    
    class Config:
        populate_by_name = True
