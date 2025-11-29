from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile, HTTPException, status
import json

from app.core.database import get_database
from app.models.file import FileInDB, File


class UploadService:
    """Service for file upload operations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.files
    
    async def get_by_id(self, file_id: str) -> FileInDB:
        """Get file by ID"""
        if not ObjectId.is_valid(file_id):
            return None
        
        file = await self.collection.find_one({"_id": ObjectId(file_id)})
        if file:
            return FileInDB(**file)
        return None
    
    async def process_upload(
        self,
        file: UploadFile,
        upload_type: str,
        name: str,
        message_id: str,
        size: int,
        metadata: str,
        user_id: str
    ) -> File:
        """Process file upload and create FILES record"""
        # Validate message_id
        if not ObjectId.is_valid(message_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid message_id format"
            )
        
        # Parse metadata JSON
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid metadata JSON format"
            )
        

        metadata_dict["upload_type"] = upload_type

        # Create FILES record
        file_dict = {
            "name": name,
            "message_id": message_id,
            "size": size,
            "metadata": metadata_dict,
            "created_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(file_dict)
        created_file = await self.get_by_id(str(result.inserted_id))
        
        return File(
            id=str(created_file.id),
            name=created_file.name,
            message_id=created_file.message_id,
            size=created_file.size,
            metadata=created_file.metadata,
            created_at=created_file.created_at
        )


upload_service = UploadService()
