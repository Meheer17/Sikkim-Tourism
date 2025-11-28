from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.community import CommunityCreate, CommunityUpdate, CommunityInDB, Community


class CommunityService:
    """Service for community operations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.communities
    
    async def get_by_id(self, community_id: str) -> Optional[CommunityInDB]:
        """Get community by ID"""
        if not ObjectId.is_valid(community_id):
            return None
        
        community = await self.collection.find_one({"_id": ObjectId(community_id)})
        if community:
            return CommunityInDB(**community)
        return None
    
    async def get_all(self, skip: int = 0, limit: int = 10) -> List[Community]:
        """Get all communities with pagination"""
        cursor = self.collection.find().skip(skip).limit(limit)
        communities = []
        async for community in cursor:
            com_db = CommunityInDB(**community)
            communities.append(Community(
                id=str(com_db.id),
                name=com_db.name,
                decription=com_db.decription,
                created_at=com_db.created_at,
                updated_at=com_db.updated_at
            ))
        return communities
    
    async def create(self, community_create: CommunityCreate) -> Community:
        """Create a new community"""
        community_dict = community_create.model_dump()
        community_dict["created_at"] = datetime.utcnow()
        community_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(community_dict)
        created_community = await self.get_by_id(str(result.inserted_id))
        
        return Community(
            id=str(created_community.id),
            name=created_community.name,
            decription=created_community.decription,
            created_at=created_community.created_at,
            updated_at=created_community.updated_at
        )
    
    async def update(self, community_id: str, community_update: CommunityUpdate) -> Community:
        """Update community"""
        community = await self.get_by_id(community_id)
        if not community:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Community not found"
            )
        
        update_data = community_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await self.collection.update_one(
            {"_id": ObjectId(community_id)},
            {"$set": update_data}
        )
        
        updated_community = await self.get_by_id(community_id)
        
        return Community(
            id=str(updated_community.id),
            name=updated_community.name,
            decription=updated_community.decription,
            created_at=updated_community.created_at,
            updated_at=updated_community.updated_at
        )
    
    async def delete(self, community_id: str) -> bool:
        """Delete community"""
        if not ObjectId.is_valid(community_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(community_id)})
        return result.deleted_count > 0


community_service = CommunityService()
