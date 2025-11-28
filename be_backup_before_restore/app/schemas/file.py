from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FileUploadResponse(BaseModel):
    file_id: str
    file_name: str
    file_size: int
    file_type: str
    telegram_file_id: str
    uploaded_at: datetime
    url: Optional[str] = None

class FileMetadata(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    file_name: str
    file_size: int
    file_type: str
    telegram_file_id: str
    telegram_message_id: int
    uploaded_at: datetime

    class Config:
        populate_by_name = True
