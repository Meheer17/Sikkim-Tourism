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
    location_id: Optional[str] = Form(None, description="Optional location ID to associate with document"),
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
            business_id=business_id,
            location_id=location_id
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
    location_id: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get uploaded documents, optionally filtered by category, business ID, or location ID.
    
    - **category**: Filter by document category (e.g., heritage_manuscript)
    - **business_id**: Filter by associated business
    - **location_id**: Filter by associated location
    - Returns list of documents with metadata
    """
    documents = await upload_service.get_documents(
        category=category,
        business_id=business_id,
        location_id=location_id,
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


@router.post("/stitch-panorama", status_code=status.HTTP_201_CREATED)
async def stitch_panorama(
    files: list[UploadFile] = File(..., description="Multiple images to stitch (2-20 images, ordered left-to-right)"),
    location_id: Optional[str] = Form(None, description="Optional location ID to associate with the panorama"),
    mode: str = Form("auto", description="Stitching mode: 'auto', 'cylindrical', or 'spherical'"),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Stitch multiple images into a 360° equirectangular panorama.
    
    - **files**: 2-20 images ordered from left to right with ~30% overlap
    - **location_id**: Optional - Associates panorama with a location
    - **mode**: Stitching projection mode
        - `auto`: Automatic detection (recommended)
        - `cylindrical`: Best for horizontal panoramas
        - `spherical`: Best for 360° photo spheres
    
    **How to capture images:**
    1. Stand in one spot and rotate horizontally
    2. Take 6-12 photos with 30-40% overlap between adjacent shots
    3. Keep camera level (avoid tilting up/down)
    4. Use consistent exposure and focus
    5. Complete a full 360° rotation for immersive panoramas
    
    **Returns:**
    - `cdn_url`: URL of the stitched 360° panorama (2:1 aspect ratio)
    - `dimensions`: Final panorama dimensions
    - `images_stitched`: Number of images successfully stitched
    
    **Processing time:** 10-60 seconds depending on image count and resolution
    """
    import tempfile
    import os
    from pathlib import Path
    from app.services.panorama_service import panorama_stitcher
    
    # Validate inputs
    if len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 images to stitch a panorama"
        )
    
    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 images allowed per panorama"
        )
    
    if mode not in ['auto', 'cylindrical', 'spherical']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mode. Use 'auto', 'cylindrical', or 'spherical'"
        )
    
    # Validate all files are images
    for file in files:
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"All files must be images. Invalid file: {file.filename}"
            )
    
    # Create temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Save uploaded images to temp directory
        image_paths = []
        for i, file in enumerate(files):
            # Save with ordered names to preserve sequence
            file_path = temp_path / f"image_{i:03d}.jpg"
            
            # Read and save file
            content = await file.read()
            with open(file_path, 'wb') as f:
                f.write(content)
            
            image_paths.append(str(file_path))
        
        # Output path for stitched panorama
        output_path = temp_path / "panorama_stitched.jpg"
        
        # Perform stitching
        success, error_msg = panorama_stitcher.stitch_images(
            image_paths=image_paths,
            output_path=str(output_path),
            mode=mode
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_msg or "Failed to stitch images. Ensure images overlap by 30-40% and are taken from the same location."
            )
        
        # Upload stitched panorama to CDN
        with open(output_path, 'rb') as f:
            panorama_file = UploadFile(
                file=f,
                filename="panorama_360.jpg",
                headers={"content-type": "image/jpeg"}
            )
            
            result = await upload_service.upload_image(
                file=panorama_file,
                location_id=location_id,
                user_id=current_user_id
            )
        
        # Add stitching metadata
        import cv2
        pano_img = cv2.imread(str(output_path))
        h, w = pano_img.shape[:2]
        
        result['dimensions'] = {'width': w, 'height': h}
        result['images_stitched'] = len(files)
        result['aspect_ratio'] = f"{w/h:.2f}:1"
        result['is_360_panorama'] = True
        
        return result
