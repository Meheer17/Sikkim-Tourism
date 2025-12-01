from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException, Query, Body
from enum import Enum
from typing import Optional
from pydantic import BaseModel

from app.core.security import get_current_user_id
from app.services.upload_service import upload_service
from app.models.file import File as FileModel

router = APIRouter()


class UploadType(str, Enum):
    glb = "glb"
    image = "image"
    audio = "audio"
    video = "video"


class UploadFromUrlRequest(BaseModel):
    url: str
    location_id: Optional[str] = None


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image_to_cdn(
    file: UploadFile = File(..., description="Image file to upload"),
    location_id: Optional[str] = Form(None, description="Optional location ID to associate with the image"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload an image to the CDN.
    
    - **file**: Image file to upload (jpg, png, gif, etc.)
    - **location_id**: Optional - If provided, saves the image metadata to database
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_image(
        file=file,
        location_id=location_id,
        user_id=current_user_id
    )
    return result


@router.post("/image/public", status_code=status.HTTP_201_CREATED)
async def upload_image_public(
    file: UploadFile = File(..., description="Image file to upload")
):
    """
    Upload an image to the CDN without authentication.
    
    - **file**: Image file to upload (jpg, png, gif, etc.)
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_image(file=file)
    return result


@router.post("/from-url", status_code=status.HTTP_201_CREATED)
async def upload_from_url(
    request: UploadFromUrlRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a file from URL to the CDN.
    
    - **url**: URL of the file to upload (image, video, etc.)
    - **location_id**: Optional - If provided, saves the file metadata to database
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_from_url(
        url=request.url,
        location_id=request.location_id,
        user_id=current_user_id
    )
    return result


@router.post("/from-url/public", status_code=status.HTTP_201_CREATED)
async def upload_from_url_public(
    request: UploadFromUrlRequest
):
    """
    Upload a file from URL to the CDN without authentication.
    
    - **url**: URL of the file to upload (image, video, etc.)
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_from_url(url=request.url)
    return result


@router.post("/model", status_code=status.HTTP_201_CREATED)
async def upload_model_to_cdn(
    file: UploadFile = File(..., description="3D model file to upload (.glb, .gltf)"),
    location_id: Optional[str] = Form(None, description="Optional location ID to associate with the model"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a 3D model to the CDN.
    
    - **file**: 3D model file to upload (.glb, .gltf)
    - **location_id**: Optional - If provided, saves the model metadata to database
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_model(
        file=file,
        location_id=location_id,
        user_id=current_user_id
    )
    return result


@router.post("/model/public", status_code=status.HTTP_201_CREATED)
async def upload_model_public(
    file: UploadFile = File(..., description="3D model file to upload (.glb, .gltf)")
):
    """
    Upload a 3D model to the CDN without authentication.
    
    - **file**: 3D model file to upload (.glb, .gltf)
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_model(file=file)
    return result


@router.post("/model/from-url", status_code=status.HTTP_201_CREATED)
async def upload_model_from_url(
    request: UploadFromUrlRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a 3D model from URL to the CDN.
    
    - **url**: URL of the 3D model file to upload (.glb, .gltf)
    - **location_id**: Optional - If provided, saves the model metadata to database
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_model_from_url(
        url=request.url,
        location_id=request.location_id,
        user_id=current_user_id
    )
    return result


@router.post("/model/from-url/public", status_code=status.HTTP_201_CREATED)
async def upload_model_from_url_public(
    request: UploadFromUrlRequest
):
    """
    Upload a 3D model from URL to the CDN without authentication.
    
    - **url**: URL of the 3D model file to upload (.glb, .gltf)
    - Returns the CDN URL and upload details
    """
    result = await upload_service.upload_model_from_url(url=request.url)
    return result


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
