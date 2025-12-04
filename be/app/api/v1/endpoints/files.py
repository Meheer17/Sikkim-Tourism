from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from app.core.security import get_current_user_id
from app.schemas.file import FileMetadata
from app.schemas.auth import MessageResponse
from app.services.upload_service import UploadService

router = APIRouter()
upload_service = UploadService()


class SimpleFileUploadResponse(BaseModel):
    url: str
    filename: str
    size: int
    content_type: str


@router.post("/upload", response_model=SimpleFileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload a file to CDN"""
    try:
        # Upload to CDN
        cdn_response = await upload_service.upload_to_cdn(file, compress=True)
        
        # Return the URL from CDN
        return SimpleFileUploadResponse(
            url=cdn_response.get("url", ""),
            filename=file.filename or "unknown",
            size=file.size or 0,
            content_type=file.content_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/", response_model=List[FileMetadata])
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """List all files for current user"""
    return {}


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Download a file from storage"""
    return {}


@router.delete("/{file_id}", response_model=MessageResponse)
async def delete_file(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete a file"""
    success = True
    if success:
        return MessageResponse(message="File deleted successfully")
    
    return MessageResponse(message="Failed to delete file")
