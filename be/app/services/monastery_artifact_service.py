from bson import ObjectId
from fastapi import HTTPException, status, UploadFile
from datetime import datetime as dt
from typing import Optional, List
import json

from app.core.database import get_database
from app.models.monastery_artifact import MonasteryArtifactCreate, MonasteryArtifact


class MonasteryArtifactService:
    """Service for managing monastery artifacts"""

    async def _get_monastery_id(self, user_id: str) -> str:
        """Get monastery ID from user ID"""
        db = get_database()
        user_business = await db.user_business.find_one({"uid": ObjectId(user_id)})
        
        if not user_business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Monastery not found"
            )
        
        return str(user_business["bid"])

    async def upload_artifact(
        self,
        user_id: str,
        file: UploadFile,
        category: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        age: Optional[str] = None,
        material: Optional[str] = None,
        dimensions: Optional[str] = None,
        historical_period: Optional[str] = None,
        tags: Optional[str] = None
    ) -> MonasteryArtifact:
        """Upload and create an artifact"""
        monastery_id = await self._get_monastery_id(user_id)
        
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            # In a real scenario, upload file to storage service
            # For now, we'll create a placeholder file reference
            file_id = str(ObjectId())
            file_url = f"/artifacts/{file_id}/{file.filename}"
            
            # Parse tags
            tags_list = []
            if tags:
                try:
                    tags_list = json.loads(tags) if isinstance(tags, str) else tags
                except:
                    tags_list = [t.strip() for t in str(tags).split(",")]

            # Build metadata
            metadata = {}
            if age:
                metadata["age"] = age
            if material:
                metadata["material"] = material
            if dimensions:
                metadata["dimensions"] = dimensions
            if historical_period:
                metadata["historical_period"] = historical_period

            artifact_data = MonasteryArtifactCreate(
                monastery_id=monastery_id,
                name=name or file.filename.split(".")[0],
                description=description or "",
                category=category,
                file_id=file_id,
                file_url=file_url,
                metadata=metadata if metadata else None,
                tags=tags_list if tags_list else None
            )

            return await self.create(monastery_id, artifact_data)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error uploading artifact: {str(e)}"
            )

    async def bulk_upload_artifacts(
        self,
        user_id: str,
        files: List[UploadFile],
        categories: Optional[List[str]] = None
    ) -> List[MonasteryArtifact]:
        """Bulk upload multiple artifacts"""
        monastery_id = await self._get_monastery_id(user_id)
        artifacts = []
        
        for idx, file in enumerate(files):
            category = categories[idx] if categories and idx < len(categories) else "other"
            artifact = await self.upload_artifact(
                user_id,
                file,
                category
            )
            artifacts.append(artifact)
        
        return artifacts

    async def create(self, monastery_id: str, artifact_data: MonasteryArtifactCreate) -> MonasteryArtifact:
        """Create a new artifact"""
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            artifact_dict = artifact_data.model_dump()
            artifact_dict["monastery_id"] = monastery_id
            artifact_dict["created_at"] = dt.utcnow()
            artifact_dict["updated_at"] = dt.utcnow()

            collection = db.monastery_artifacts
            result = await collection.insert_one(artifact_dict)

            created = await collection.find_one({"_id": result.inserted_id})
            return self._to_artifact(created)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating artifact: {str(e)}"
            )

    async def get_by_id(self, artifact_id: str, user_id: str) -> MonasteryArtifact:
        """Get artifact by ID"""
        monastery_id = await self._get_monastery_id(user_id)
        print(artifact_id)
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            collection = db.monastery_artifacts
            artifact = await collection.find_one({
                "_id": ObjectId(artifact_id),
                "monastery_id": monastery_id
            })
            
            if not artifact:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Artifact not found"
                )
            
            return self._to_artifact(artifact)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving artifact: {str(e)}"
            )

    async def get_by_monastery(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[MonasteryArtifact], int]:
        """Get artifacts for a monastery"""
        monastery_id = await self._get_monastery_id(user_id)
        
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            collection = db.monastery_artifacts
            query = {"monastery_id": monastery_id}

            if category:
                query["category"] = category

            if search:
                query["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}}
                ]

            total = await collection.count_documents(query)
            artifacts = await collection.find(query).skip(skip).limit(limit).to_list(length=limit)

            return [self._to_artifact(a) for a in artifacts], total
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving artifacts: {str(e)}"
            )

    async def update(self, artifact_id: str, user_id: str, data: dict) -> MonasteryArtifact:
        """Update artifact"""
        monastery_id = await self._get_monastery_id(user_id)
        
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            collection = db.monastery_artifacts
            
            # Verify ownership
            existing = await collection.find_one({
                "_id": ObjectId(artifact_id),
                "monastery_id": monastery_id
            })
            
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Artifact not found"
                )

            data["updated_at"] = dt.utcnow()
            await collection.update_one(
                {"_id": ObjectId(artifact_id)},
                {"$set": data}
            )

            updated = await collection.find_one({"_id": ObjectId(artifact_id)})
            return self._to_artifact(updated)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating artifact: {str(e)}"
            )

    async def delete(self, artifact_id: str, user_id: str) -> None:
        """Delete artifact"""
        monastery_id = await self._get_monastery_id(user_id)
        
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            collection = db.monastery_artifacts
            
            # Verify ownership
            existing = await collection.find_one({
                "_id": ObjectId(artifact_id),
                "monastery_id": monastery_id
            })
            
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Artifact not found"
                )

            await collection.delete_one({"_id": ObjectId(artifact_id)})
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting artifact: {str(e)}"
            )

    async def get_statistics(self, user_id: str) -> dict:
        """Get artifact statistics for monastery"""
        print("user_id:", user_id)
        monastery_id = await self._get_monastery_id(user_id)
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not connected"
            )

        try:
            collection = db.monastery_artifacts
            
            # Count by category
            pipeline = [
                {"$match": {"monastery_id": ObjectId(monastery_id)}},
                {"$group": {
                    "_id": "$category",
                    "count": {"$sum": 1}
                }}
            ]
            
            category_results = await collection.aggregate(pipeline).to_list(None)
            by_category = {item["_id"]: item["count"] for item in category_results}
            total = sum(by_category.values())

            # Calculate storage used (placeholder - in real scenario, would track file sizes)
            storage_used = total * 1024 * 100  # Estimate 100KB per artifact
            storage_limit = 5 * 1024 * 1024 * 1024  # 5GB limit

            return {
                "total": total,
                "by_category": by_category,
                "storage_used": storage_used,
                "storage_limit": storage_limit
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving statistics: {str(e)}"
            )

    def _to_artifact(self, doc: dict) -> MonasteryArtifact:
        """Convert database document to artifact model"""
        if doc is None:
            return None
        
        return MonasteryArtifact(
            id=str(doc.get("_id")),
            monastery_id=doc.get("monastery_id"),
            name=doc.get("name"),
            description=doc.get("description"),
            category=doc.get("category"),
            file_id=doc.get("file_id"),
            file_url=doc.get("file_url"),
            thumbnail_url=doc.get("thumbnail_url"),
            metadata=doc.get("metadata"),
            tags=doc.get("tags"),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at")
        )


monastery_artifact_service = MonasteryArtifactService()
