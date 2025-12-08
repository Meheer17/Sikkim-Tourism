from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status
import httpx
from typing import Optional
from PIL import Image
import io
import tempfile
import os
from moviepy.editor import VideoFileClip

from app.core.database import get_database
from app.models.file import FileInDB
from app.core.config import settings


class UploadService:
    """Service for file upload operations"""
    
    def __init__(self):
        # Lazy DB resolution to avoid import-time DB access
        self.db = None
        self.collection = None
        self.cdn_url = settings.CDN_URL
        self.cdn_model_url = settings.CDN_MODEL_URL
        self.cdn_api_key = settings.CDN_API_KEY
        # Local IP for replacing localhost URLs (update this to your IP)
        self.local_ip = settings.LOCAL_IP

    def _collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database not connected")
        return db.files
    
    async def compress_image(self, file_content: bytes, max_size_mb: float = 1.0, quality: int = 85) -> bytes:
        """
        Compress image to reduce file size
        
        Args:
            file_content: Original image bytes
            max_size_mb: Maximum size in MB (default 1.0 MB)
            quality: JPEG quality 1-100 (default 85)
            
        Returns:
            Compressed image bytes
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(file_content))
            
            # Convert RGBA to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate max dimensions to maintain aspect ratio
            max_dimension = 2048  # Max width or height
            if img.width > max_dimension or img.height > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            
            # Compress image
            output = io.BytesIO()
            current_quality = quality
            
            # Iteratively reduce quality until size is acceptable
            while current_quality > 20:
                output.seek(0)
                output.truncate()
                img.save(output, format='JPEG', quality=current_quality, optimize=True)
                
                size_mb = output.tell() / (1024 * 1024)
                if size_mb <= max_size_mb:
                    break
                    
                current_quality -= 5
            
            return output.getvalue()
            
        except Exception as e:
            # If compression fails, return original
            print(f"Image compression failed: {str(e)}")
            return file_content
    
    async def compress_video(self, file_content: bytes, original_filename: str, max_size_mb: float = 10.0) -> bytes:
        """
        Compress video to reduce file size
        
        Args:
            file_content: Original video bytes
            original_filename: Original filename to preserve extension
            max_size_mb: Maximum size in MB (default 10.0 MB)
            
        Returns:
            Compressed video bytes
        """
        temp_input = None
        temp_output = None
        
        try:
            # Create temporary files
            file_ext = os.path.splitext(original_filename)[1] or '.mp4'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_in:
                temp_input = temp_in.name
                temp_in.write(file_content)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_out:
                temp_output = temp_out.name
            
            # Load video
            video = VideoFileClip(temp_input)
            
            # Calculate target bitrate based on max size
            duration = video.duration
            target_bitrate = int((max_size_mb * 8 * 1024) / duration) if duration > 0 else 1000
            target_bitrate = max(500, min(target_bitrate, 2000))  # Between 500-2000 kbps
            
            # Resize if too large
            max_dimension = 1280
            if video.w > max_dimension or video.h > max_dimension:
                scale_factor = min(max_dimension / video.w, max_dimension / video.h)
                new_width = int(video.w * scale_factor)
                new_height = int(video.h * scale_factor)
                # Ensure dimensions are even (required for h264)
                new_width = new_width if new_width % 2 == 0 else new_width - 1
                new_height = new_height if new_height % 2 == 0 else new_height - 1
                video = video.resize((new_width, new_height))
            
            # Write compressed video
            video.write_videofile(
                temp_output,
                codec='libx264',
                audio_codec='aac',
                bitrate=f"{target_bitrate}k",
                preset='medium',
                threads=4,
                logger=None  # Suppress moviepy logs
            )
            
            video.close()
            
            # Read compressed video
            with open(temp_output, 'rb') as f:
                compressed_content = f.read()
            
            # If compressed size is still larger than original, return original
            if len(compressed_content) > len(file_content):
                return file_content
            
            return compressed_content
            
        except Exception as e:
            print(f"Video compression failed: {str(e)}")
            return file_content
            
        finally:
            # Cleanup temp files
            if temp_input and os.path.exists(temp_input):
                try:
                    os.unlink(temp_input)
                except:
                    pass
            if temp_output and os.path.exists(temp_output):
                try:
                    os.unlink(temp_output)
                except:
                    pass
    
    async def get_by_id(self, file_id: str) -> FileInDB:
        """Get file by ID"""
        if not ObjectId.is_valid(file_id):
            return None

        file = await self._collection().find_one({"_id": ObjectId(file_id)})
        if file:
            return FileInDB(**file)
        return None
    
    async def upload_to_cdn(self, file: UploadFile, compress: bool = True) -> dict:
        """Upload image to external CDN with optional compression"""
        try:
            # Read file content
            file_content = await file.read()
            
            # Compress image if requested and it's an image
            if compress and file.content_type and file.content_type.startswith('image/'):
                file_content = await self.compress_image(file_content)
            
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
                    
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN upload failed: {e.response.status_code} - {e.response.text}"
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
    
    async def upload_from_url_to_cdn(self, url: str, compress: bool = True) -> dict:
        """Upload file from URL to external CDN with optional compression"""
        try:
            # If compression is requested, download the file first
            if compress:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    download_response = await client.get(url)
                    
                    if download_response.status_code != 200:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Failed to download file from URL: {url}"
                        )
                    
                    file_content = download_response.content
                    content_type = download_response.headers.get('content-type', '')
                    
                    # Compress if it's an image or video
                    if content_type.startswith('image/'):
                        file_content = await self.compress_image(file_content)
                    elif content_type.startswith('video/'):
                        filename = url.split('/')[-1]
                        file_content = await self.compress_video(file_content, filename)
                    
                    # Upload compressed content
                    files = {
                        "file": (url.split('/')[-1], file_content, content_type)
                    }
                    
                    headers = {
                        "X-API-Key": self.cdn_api_key
                    }
                    
                    upload_response = await client.post(
                        self.cdn_url,
                        headers=headers,
                        files=files
                    )
                    
                    if upload_response.status_code == 200:
                        return upload_response.json()
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"CDN upload failed: {upload_response.text}"
                        )
            else:
                # Direct URL upload without compression
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
        
        # Extract CDN URL and convert to API proxy URL
        cdn_url = cdn_response.get("url", "") or cdn_response.get("cdnUrl", "")
        
        # Convert CDN URL to API proxy URL
        # From: http://localhost:3000/images/filename.jpg
        # To: http://172.17.124.111:8000/api/v1/cdn/images/filename.jpg
        if cdn_url:
            # Extract filename from CDN URL
            import re
            filename_match = re.search(r'/images/([^/]+)$', cdn_url)
            if filename_match:
                filename = filename_match.group(1)
                # Use local IP for the API server
                cdn_url = f"http://{self.local_ip}:8000/api/v1/cdn/images/{filename}"
        
        # Also update nested cdn_response URLs
        if cdn_response.get("cdnUrl"):
            filename_match = re.search(r'/images/([^/]+)$', cdn_response["cdnUrl"])
            if filename_match:
                filename = filename_match.group(1)
                cdn_response["cdnUrl"] = f"http://{self.local_ip}:8000/api/v1/cdn/images/{filename}"
        
        if cdn_response.get("viewUrl"):
            filename_match = re.search(r'/images/([^/]+)$', cdn_response["viewUrl"])
            if filename_match:
                filename = filename_match.group(1)
                cdn_response["viewUrl"] = f"http://{self.local_ip}:8000/api/v1/cdn/images/{filename}"
        
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
                "cdn_url": cdn_url,
                "cdn_response": cdn_response,
                "filename": file.filename
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_url,
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
    
    async def upload_video(
        self,
        file: UploadFile,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload video to CDN with automatic compression and optionally save metadata to database"""
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('video/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only video files are allowed"
            )
        
        # Read and compress video
        file_content = await file.read()
        compressed_content = await self.compress_video(file_content, file.filename)
        
        # Upload compressed video to CDN
        try:
            files = {
                "file": (file.filename, compressed_content, file.content_type)
            }
            
            headers = {
                "X-API-Key": self.cdn_api_key
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.cdn_url,
                    headers=headers,
                    files=files
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN upload failed: {response.text}"
                    )
                
                cdn_response = response.json()
        
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            file_data = {
                "file_name": file.filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "video",
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "original_size": len(file_content),
                "compressed_size": len(compressed_content)
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": file.filename,
                "compression_ratio": f"{(1 - len(compressed_content)/len(file_content)) * 100:.1f}%"
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "filename": file.filename,
            "compression_ratio": f"{(1 - len(compressed_content)/len(file_content)) * 100:.1f}%"
        }
    
    async def upload_video_from_url(
        self,
        url: str,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> dict:
        """Upload video from URL to CDN with automatic compression and optionally save metadata to database"""
        
        # Download the video
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                download_response = await client.get(url)
                
                if download_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to download video from URL: {url}"
                    )
                
                file_content = download_response.content
                content_type = download_response.headers.get('content-type', 'video/mp4')
                filename = url.split('/')[-1]
                
                # Compress video
                compressed_content = await self.compress_video(file_content, filename)
                
                # Upload compressed video to CDN
                files = {
                    "file": (filename, compressed_content, content_type)
                }
                
                headers = {
                    "X-API-Key": self.cdn_api_key
                }
                
                upload_response = await client.post(
                    self.cdn_url,
                    headers=headers,
                    files=files
                )
                
                if upload_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"CDN upload failed: {upload_response.text}"
                    )
                
                cdn_response = upload_response.json()
        
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        
        # Optionally save to database if location_id is provided
        if location_id and ObjectId.is_valid(location_id):
            file_data = {
                "file_name": filename,
                "file_path": cdn_response.get("url", ""),
                "file_type": "video",
                "l_id": ObjectId(location_id),
                "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
                "cdn_response": cdn_response,
                "created_at": datetime.utcnow(),
                "source_url": url,
                "original_size": len(file_content),
                "compressed_size": len(compressed_content)
            }
            
            result = await self._collection().insert_one(file_data)
            file_data["_id"] = result.inserted_id
            
            return {
                "file_id": str(result.inserted_id),
                "cdn_url": cdn_response.get("url", ""),
                "cdn_response": cdn_response,
                "filename": filename,
                "source_url": url,
                "compression_ratio": f"{(1 - len(compressed_content)/len(file_content)) * 100:.1f}%"
            }
        
        # Return CDN response without saving to DB
        return {
            "cdn_url": cdn_response.get("url", ""),
            "cdn_response": cdn_response,
            "source_url": url,
            "filename": filename,
            "compression_ratio": f"{(1 - len(compressed_content)/len(file_content)) * 100:.1f}%"
        }
    
    async def upload_document(
        self, 
        file: UploadFile, 
        category: str = "document", 
        user_id: Optional[str] = None,
        business_id: Optional[str] = None
    ):
        """
        Upload scanned document (from document scanner) to CDN and save metadata to database
        
        Args:
            file: Scanned document file (image or PDF)
            category: Document category for organization
            user_id: User who uploaded the document
            business_id: Optional business ID to associate with document
            
        Returns:
            Upload details with CDN URL
        """
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if not file.content_type or file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported document type: {file.content_type}. Supported: JPG, PNG, PDF"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Compress if it's an image
        compressed_content = file_content
        if file.content_type.startswith('image/'):
            # Higher quality for documents (90 vs 85)
            compressed_content = await self.compress_image(file_content, max_size_mb=2.0, quality=90)
        
        # Reset file pointer
        await file.seek(0)
        
        # Upload to CDN
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                files = {
                    'file': (file.filename, compressed_content, file.content_type)
                }
                
                headers = {
                    'Authorization': f'Bearer {self.cdn_api_key}'
                } if self.cdn_api_key else {}
                
                # CDN_URL already includes the /upload path
                endpoint = self.cdn_url
                
                print(f"[DEBUG] Uploading document to CDN: {endpoint}")
                print(f"[DEBUG] File: {file.filename}, Type: {file.content_type}, Size: {len(compressed_content)} bytes")
                
                upload_response = await client.post(
                    endpoint,
                    files=files,
                    headers=headers
                )
                
                print(f"[DEBUG] CDN Response Status: {upload_response.status_code}")
                print(f"[DEBUG] CDN Response Body: {upload_response.text}")
                
                upload_response.raise_for_status()
                cdn_response = upload_response.json()
        
        except httpx.HTTPStatusError as e:
            print(f"[ERROR] CDN HTTP Error: Status {e.response.status_code}, Body: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN upload failed: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            print(f"[ERROR] CDN Request Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"CDN service unavailable: {str(e)}"
            )
        
        # Extract CDN URL
        cdn_url = cdn_response.get("url", "") or cdn_response.get("cdnUrl", "")
        
        # Convert CDN URL to API proxy URL if needed
        if cdn_url and "/images/" in cdn_url:
            import re
            filename_match = re.search(r'/images/([^/]+)$', cdn_url)
            if filename_match:
                filename = filename_match.group(1)
                cdn_url = f"http://{self.local_ip}:8000/api/v1/cdn/images/{filename}"
        
        # Save to database with document category
        file_data = {
            "file_name": file.filename,
            "file_path": cdn_url,
            "file_type": "document",
            "category": category,
            "business_id": ObjectId(business_id) if business_id and ObjectId.is_valid(business_id) else None,
            "uploaded_by": ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None,
            "cdn_response": cdn_response,
            "created_at": datetime.utcnow(),
            "original_size": len(file_content),
            "compressed_size": len(compressed_content) if compressed_content != file_content else None,
            "mime_type": file.content_type
        }
        
        result = await self._collection().insert_one(file_data)
        
        return {
            "file_id": str(result.inserted_id),
            "url": cdn_url,
            "cdn_url": cdn_url,
            "cdn_response": cdn_response,
            "filename": file.filename,
            "category": category,
            "size": len(compressed_content),
            "compression_ratio": f"{(1 - len(compressed_content)/len(file_content)) * 100:.1f}%" if compressed_content != file_content else "0%"
        }
    
    async def get_documents(
        self,
        category: Optional[str] = None,
        business_id: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """
        Get documents with optional filters
        
        Args:
            category: Document category filter
            business_id: Business ID filter
            user_id: User ID (for permission checking)
            
        Returns:
            List of documents
        """
        query = {}
        
        if category:
            query["category"] = category
        
        if business_id and ObjectId.is_valid(business_id):
            query["business_id"] = ObjectId(business_id)
        
        print(f"[DEBUG] Querying documents with: {query}")
        
        # Get documents from database
        cursor = self._collection().find(query).sort("created_at", -1)
        documents = await cursor.to_list(length=None)
        
        print(f"[DEBUG] Found {len(documents)} documents")
        
        # Convert ObjectId to string
        for doc in documents:
            doc["_id"] = str(doc["_id"])
            if "uploaded_by" in doc and doc["uploaded_by"]:
                doc["uploaded_by"] = str(doc["uploaded_by"])
            if "business_id" in doc and doc["business_id"]:
                doc["business_id"] = str(doc["business_id"])
        
        return documents
    
    async def delete_document(self, file_id: str, user_id: str):
        """
        Delete a document by ID
        
        Args:
            file_id: Document file ID
            user_id: User requesting deletion (for permission checking)
        """
        if not ObjectId.is_valid(file_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file ID"
            )
        
        # Find the document
        document = await self._collection().find_one({"_id": ObjectId(file_id)})
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete from database
        await self._collection().delete_one({"_id": ObjectId(file_id)})
        
        # Note: CDN file deletion would go here if needed
        # For now, we only delete the database record
        
        return True
    
    async def process_upload(
        self,
    ):
        """Process file upload and create FILES record"""
        

        return {}


upload_service = UploadService()
