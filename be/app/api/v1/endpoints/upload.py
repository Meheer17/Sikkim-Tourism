from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from enum import Enum

from app.core.security import get_current_user_id
from app.services.upload_service import upload_service
from app.models.file import File as FileModel

router = APIRouter()


class UploadType(str, Enum):
    glb = "glb"
    image = "image"
    audio = "audio"
    video = "video"


@router.post("/{type}", response_model=FileModel, status_code=status.HTTP_201_CREATED)
async def upload_file(
    type: UploadType,
    file: UploadFile = File(...),
    name: str = Form(..., max_length=512),
    message_id: str = Form(...),
    size: int = Form(..., gt=0),
    metadata: str = Form(...),  # JSON string
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload file ('glb' | 'image' | 'audio' | 'video'); creates FILES record"""
    result = await upload_service.process_upload(
        file=file,
        upload_type=type.value,
        name=name,
        message_id=message_id,
        size=size,
        metadata=metadata,
        user_id=current_user_id
    )
    return result
