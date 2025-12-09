from fastapi import APIRouter, status, UploadFile, File, Form, Query, Depends
from typing import Optional, List

from app.schemas.auth import MonasteryRegistrationRequest
from app.services.monastery_service import monastery_service
from app.services.monastery_artifact_service import monastery_artifact_service
from app.models.monastery_artifact import MonasteryArtifactCreate
from app.core.security import get_current_user_id

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_monastery(monastery_data: MonasteryRegistrationRequest):
    """
    Register a new monastery.
    
    This endpoint orchestrates the complete monastery registration flow:
    1. Creates a user account with role=business
    2. Creates a location entry with type=monastery
    3. Creates a business entry with the hardcoded monastery type_id
    4. Links the user and business in the user_business collection
    
    Returns:
        Dictionary containing user, location, and business information
    """
    result = await monastery_service.register_monastery(monastery_data)
    return result


@router.get("/me")
async def get_monastery_details(current_user_id: str = Depends(get_current_user_id)):
    """Get current monastery details"""
    return await monastery_service.get_monastery_details(current_user_id)


@router.put("/me")
async def update_monastery(
    data: dict,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update monastery information"""
    return await monastery_service.update_monastery(current_user_id, data)


@router.post("/artifacts/upload", status_code=status.HTTP_201_CREATED)
async def upload_artifact(
    file: UploadFile = File(...),
    category: str = Form(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    dimensions: Optional[str] = Form(None),
    historical_period: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Upload an artifact for the monastery to cloud storage.
    
    This endpoint uploads files to CDN cloud storage and stores metadata in MongoDB.
    Supports automatic compression for images and proper categorization for heritage artifacts.
    
    **Categories:**
    - `manuscript`: Ancient manuscripts and texts
    - `scripture`: Religious scriptures and texts
    - `artifact`: Cultural artifacts and relics
    - `document`: Historical documents
    - `image`: Heritage images and photographs
    - `painting`: Traditional paintings and artwork
    - `sculpture`: Sculptures and carved items
    - `textile`: Traditional textiles and fabrics
    - `other`: Other heritage items
    
    **Supported file types:**
    - Images: jpg, png, gif, webp (auto-compressed)
    - Documents: pdf
    - Files are uploaded to CDN and accessible via returned URLs
    
    **Returns:**
    - `file_id`: Unique identifier for the uploaded file
    - `file_url`: CDN URL for accessing the file
    - `cdn_response`: Full CDN upload response with metadata
    - Artifact metadata including upload information
    """
    return await monastery_artifact_service.upload_artifact(
        current_user_id,
        file,
        category,
        name,
        description,
        age,
        material,
        dimensions,
        historical_period,
        tags
    )


@router.get("/artifacts")
async def get_artifacts(
    category: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    search: Optional[str] = Query(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all artifacts for the monastery"""
    artifacts, total = await monastery_artifact_service.get_by_monastery(
        current_user_id,
        skip,
        limit,
        category,
        search
    )
    return {
        "artifacts": artifacts,
        "total": total
    }


@router.get("/artifacts/stats")
async def get_artifact_stats(current_user_id: str = Depends(get_current_user_id)):
    """Get artifact statistics"""
    return await monastery_artifact_service.get_statistics(current_user_id)


@router.get("/artifacts/{artifact_id}")
async def get_artifact(
    artifact_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get a specific artifact"""
    return await monastery_artifact_service.get_by_id(artifact_id, current_user_id)


@router.put("/artifacts/{artifact_id}")
async def update_artifact(
    artifact_id: str,
    data: dict,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update artifact metadata"""
    return await monastery_artifact_service.update(artifact_id, current_user_id, data)


@router.delete("/artifacts/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artifact(
    artifact_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete an artifact"""
    await monastery_artifact_service.delete(artifact_id, current_user_id)


@router.post("/artifacts/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_artifacts(
    files: List[UploadFile] = File(...),
    categories: Optional[List[str]] = Form(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """Bulk upload artifacts with detailed results"""
    return await monastery_artifact_service.bulk_upload_artifacts(
        current_user_id,
        files,
        categories
    )


@router.get("/artifacts/files")
async def get_artifact_files(
    category: Optional[str] = Query(None, description="Filter by artifact category"),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get uploaded artifact files from CDN storage"""
    files = await monastery_artifact_service.get_artifact_files(
        current_user_id,
        category
    )
    return {
        "files": files,
        "total": len(files)
    }


@router.delete("/artifacts/files/{file_id}", status_code=status.HTTP_200_OK)
async def delete_artifact_file(
    file_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete an artifact file from CDN storage"""
    # Import upload service singleton for file deletion
    from app.services.upload_service import upload_service
    
    # Delete the file from upload service
    await upload_service.delete_document(file_id, current_user_id)
    
    return {"message": "Artifact file deleted successfully"}


