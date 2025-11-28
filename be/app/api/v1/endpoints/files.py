from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status, Query
from fastapi.responses import StreamingResponse
import io

from app.core.security import get_current_user_id
from app.services.telegram_service import telegram_storage_service
from app.schemas.file import FileUploadResponse, FileMetadata
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload a file to Telegram storage"""
    result = await telegram_storage_service.upload_file(file, current_user_id)
    return result


@router.get("/", response_model=List[FileMetadata])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """List all files for current user"""
    files = await telegram_storage_service.list_user_files(current_user_id, skip, limit)
    return files


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Download a file from Telegram storage"""
    file_content, file_name, file_type = await telegram_storage_service.download_file(
        file_id,
        current_user_id
    )
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=file_type,
        headers={
            "Content-Disposition": f"attachment; filename={file_name}"
        }
    )


@router.delete("/{file_id}", response_model=MessageResponse)
async def delete_file(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a file"""
    success = await telegram_storage_service.delete_file(file_id, current_user_id)
    
    if success:
        return MessageResponse(message="File deleted successfully")
    
    return MessageResponse(message="Failed to delete file")
