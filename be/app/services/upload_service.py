from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status
import httpx
from typing import Optional

from app.core.database import get_database
from app.models.file import FileInDB


class UploadService:
    """Service for file upload operations"""
    
    def __init__(self):
        # Lazy DB resolution to avoid import-time DB access
        self.db = None
        self.collection = None
        self.cdn_url = "https://models.shrishesha.space/api/media/upload"
        self.cdn_model_url = "https://models.shrishesha.space/api/models/upload"
        self.cdn_api_key = "promatrs@25"

    def _collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database not connected")
        return db.files
    
    async def get_by_id(self, file_id: str) -> FileInDB:
        """Get file by ID"""
        if not ObjectId.is_valid(file_id):
            return None

        file = await self._collection().find_one({"_id": ObjectId(file_id)})
        if file:
            return FileInDB(**file)
        return None
    
    async def upload_to_cdn(self, file: UploadFile) -> dict:
        """Upload image to external CDN"""
        try:
            # Read file content
            file_content = await file.read()
            
            # Reset file pointer for potential reuse
            await file.seek(0)
            
            # Prepare the multipart form data
            files = {
                "file": (file.filename, file_content, file.content_type)
            }
            
            headers = {
                "X-API-Key": self.cdn_api_key
            }
            
            # Upload to CDN
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.cdn_url,
                    headers=headers,
                    files=files
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN upload failed: {response.text}"
                    )
                    
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
    
    async def upload_model_to_cdn(self, file: UploadFile) -> dict:
        """Upload 3D model file to external CDN"""
        try:
            # Read file content
            file_content = await file.read()
            
            # Reset file pointer for potential reuse
            await file.seek(0)
            
            # Prepare the multipart form data
            files = {
                "file": (file.filename, file_content, file.content_type)
            }
            
            headers = {
                "X-API-Key": self.cdn_api_key
            }
            
            # Upload to CDN models endpoint
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.cdn_model_url,
                    headers=headers,
                    files=files
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN model upload failed: {response.text}"
                    )
                    
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model upload failed: {str(e)}"
            )
    
    async def upload_model_from_url_to_cdn(self, url: str) -> dict:
        """Upload 3D model from URL to external CDN"""
        try:
            headers = {
                "X-API-Key": self.cdn_api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "url": url
            }
            
            # Upload to CDN models endpoint
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.cdn_model_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN model upload failed: {response.text}"
                    )
                    
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model upload failed: {str(e)}"
            )
    
    async def upload_from_url_to_cdn(self, url: str) -> dict:
        """Upload file from URL to external CDN"""
        try:
            headers = {
                "X-API-Key": self.cdn_api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "url": url
            }
            
            # Upload to CDN
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.cdn_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN upload failed: {response.text}"
                    )
                    
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
    
    async def upload_image(
        self,
        file: UploadFile,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload image to CDN and optionally save metadata to database"""
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Upload to CDN
        cdn_response = await self.upload_to_cdn(file)
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            file_data = {
                "file_name": file.filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "image",
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "size": file.size if hasattr(file, 'size') else None
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": file.filename
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "filename": file.filename
        }
    
    async def upload_from_url(
        self,
        url: str,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload file from URL to CDN and optionally save metadata to database"""
        
        # Upload to CDN from URL
        cdn_response = await self.upload_from_url_to_cdn(url)
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            # Extract filename from URL or CDN response
            filename = cdn_response.get("filename", url.split("/")[-1])
            
            file_data = {
                "file_name": filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "image",  # Could be detected from URL or CDN response
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "source_url": url
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": filename,
                "source_url": url
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "source_url": url
        }
    
    async def upload_model(
        self,
        file: UploadFile,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload 3D model to CDN and optionally save metadata to database"""
        
        # Validate file type (glb, gltf)
        if not file.content_type or not (
            file.content_type in ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'] or
            file.filename.endswith(('.glb', '.gltf'))
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only 3D model files are allowed (.glb, .gltf)"
            )
        
        # Upload to CDN
        cdn_response = await self.upload_model_to_cdn(file)
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            file_data = {
                "file_name": file.filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "model",
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "size": file.size if hasattr(file, 'size') else None
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": file.filename
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "filename": file.filename
        }
    
    async def upload_model_from_url(
        self,
        url: str,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload 3D model from URL to CDN and optionally save metadata to database"""
        
        # Upload to CDN from URL
        cdn_response = await self.upload_model_from_url_to_cdn(url)
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            # Extract filename from URL or CDN response
            filename = cdn_response.get("filename", url.split("/")[-1])
            
            file_data = {
                "file_name": filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "model",
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "source_url": url
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": filename,
                "source_url": url
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "source_url": url
        }
    
    async def process_upload(
        self,
    ):
        """Process file upload and create FILES record"""
        

        return {}


upload_service = UploadService()
