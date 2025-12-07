from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.core.security import get_current_user_id
from app.services.upload_service import upload_service

router = APIRouter()


class UploadFromUrlRequest(BaseModel):
    url: str
    location_id: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(..., description="File to upload (image, video, or 3D model)"),
    location_id: Optional[str] = Form(None, description="Optional location ID to associate with the file"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a file to the CDN with automatic compression for images and videos.
    
    - **file**: File to upload (supports images, videos, and 3D models)
    - **location_id**: Optional - If provided, saves the file metadata to database
    - Returns the CDN URL and upload details
    
    Supported formats:
    - Images: jpg, png, gif, webp (auto-compressed)
    - Videos: mp4, mov, avi, webm (auto-compressed)
    - Models: glb, gltf
    """
    content_type = file.content_type or ""
    
    # Route to appropriate upload handler based on content type
    if content_type.startswith('image/'):
        result = await upload_service.upload_image(
            file=file,
            location_id=location_id,
            user_id=current_user_id
        )
    elif content_type.startswith('video/'):
        result = await upload_service.upload_video(
            file=file,
            location_id=location_id,
            user_id=current_user_id
        )
    elif content_type in ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'] or \
         file.filename.endswith(('.glb', '.gltf')):
        result = await upload_service.upload_model(
            file=file,
            location_id=location_id,
            user_id=current_user_id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Supported: images, videos, 3D models"
        )
    
    return result


@router.post("/document", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Document to upload (scanned images, PDFs)"),
    category: Optional[str] = Form("document", description="Document category (e.g., business_license, verification)"),
    business_id: Optional[str] = Form(None, description="Optional business ID to associate with document"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a scanned document (from document scanner or file picker).
    
    - **file**: Document file (jpg, png, pdf)
    - **category**: Document category for organization
    - Returns the CDN URL and upload details
    
    Supported formats:
    - Images: jpg, png (from document scanner)
    - Documents: pdf
    
    Common categories:
    - business_license
    - business_registration
    - admin_verification
    - admin_id_verification
    - tax_document
    - permit
    - heritage_manuscript (ancient manuscripts and texts)
    - heritage_scripture (religious scriptures)
    - heritage_artifact (cultural artifacts and relics)
    """
    content_type = file.content_type or ""
    filename = file.filename or "document"
    
    # Accept images and PDFs
    if content_type.startswith('image/') or content_type == 'application/pdf':
        result = await upload_service.upload_document(
            file=file,
            category=category,
            user_id=current_user_id,
            business_id=business_id
        )
        return result
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document type: {content_type}. Supported: images (jpg, png), PDF"
        )


@router.post("/from-url", status_code=status.HTTP_201_CREATED)
async def upload_from_url(
    request: UploadFromUrlRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload a file from URL to the CDN with automatic compression.
    
    - **url**: URL of the file to upload (image, video, or 3D model)
    - **location_id**: Optional - If provided, saves the file metadata to database
    - Returns the CDN URL and upload details
    
    The file type is auto-detected from the URL/content type.
    Images and videos are automatically compressed.
    """
    # Try to detect file type from URL
    url_lower = request.url.lower()
    
    if url_lower.endswith(('.glb', '.gltf')):
        result = await upload_service.upload_model_from_url(
            url=request.url,
            location_id=request.location_id,
            user_id=current_user_id
        )
    elif url_lower.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
        result = await upload_service.upload_video_from_url(
            url=request.url,
            location_id=request.location_id,
            user_id=current_user_id
        )
    else:
        # Default to image/general file upload
        result = await upload_service.upload_from_url(
            url=request.url,
            location_id=request.location_id,
            user_id=current_user_id
        )
    
    return result


@router.get("/documents", status_code=status.HTTP_200_OK)
async def get_documents(
    category: Optional[str] = None,
    business_id: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get uploaded documents, optionally filtered by category and business ID.
    
    - **category**: Filter by document category (e.g., heritage_manuscript)
    - **business_id**: Filter by associated business
    - Returns list of documents with metadata
    """
    documents = await upload_service.get_documents(
        category=category,
        business_id=business_id,
        user_id=current_user_id
    )
    return {"documents": documents}


@router.delete("/documents/{file_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Delete a document by its file ID.
    
    - **file_id**: ID of the document to delete
    - Returns success message
    """
    await upload_service.delete_document(file_id, current_user_id)
    return {"message": "Document deleted successfully"}
