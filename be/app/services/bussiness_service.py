from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.bussiness import BussinessCreate, BussinessUpdate, BussinessInDB, Bussiness


class BussinessService:
    """Service for bussiness operations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.bussiness
        self.user_bussiness_collection = self.db.user_bussiness
    
    async def get_by_id(self, bussiness_id: str) -> Optional[BussinessInDB]:
        """Get bussiness by ID"""
        if not ObjectId.is_valid(bussiness_id):
            return None
        
        bussiness = await self.collection.find_one({"_id": ObjectId(bussiness_id)})
        if bussiness:
            return BussinessInDB(**bussiness)
        return None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        position_lat: Optional[float] = None,
        position_lng: Optional[float] = None,
        radius_m: Optional[int] = None,
        type_id: Optional[str] = None
    ) -> List[Bussiness]:
        """Get all businesses with pagination and filters"""
        query = {}
        
        # Filter by type_id if provided
        if type_id:
            query["type_id"] = type_id
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        businesses = []
        async for bussiness in cursor:
            bus_db = BussinessInDB(**bussiness)
            businesses.append(Bussiness(
                id=str(bus_db.id),
                name=bus_db.name,
                description=bus_db.description,
                short_description=bus_db.short_description,
                open_hours=bus_db.open_hours,
                type_id=bus_db.type_id,
                l_id=bus_db.l_id,
                scheduled_at=bus_db.scheduled_at,
                created_at=bus_db.created_at,
                updated_at=bus_db.updated_at
            ))
        return businesses
    
    async def get_by_owner(self, user_id: str, skip: int = 0, limit: int = 10) -> List[Bussiness]:
        """Get businesses owned by a user"""
        # First get the business IDs from user_bussiness where user is owner
        cursor = self.user_bussiness_collection.find({
            "uid": user_id,
            "role": "owner"
        })
        
        bussiness_ids = []
        async for ub in cursor:
            bussiness_ids.append(ObjectId(ub["bid"]))
        
        if not bussiness_ids:
            return []
        
        # Get the businesses
        cursor = self.collection.find({"_id": {"$in": bussiness_ids}}).skip(skip).limit(limit)
        businesses = []
        async for bussiness in cursor:
            bus_db = BussinessInDB(**bussiness)
            businesses.append(Bussiness(
                id=str(bus_db.id),
                name=bus_db.name,
                description=bus_db.description,
                short_description=bus_db.short_description,
                open_hours=bus_db.open_hours,
                type_id=bus_db.type_id,
                l_id=bus_db.l_id,
                scheduled_at=bus_db.scheduled_at,
                created_at=bus_db.created_at,
                updated_at=bus_db.updated_at
            ))
        return businesses
    
    async def create(self, bussiness_create: BussinessCreate, user_id: str) -> Bussiness:
        """Create a new bussiness"""
        bussiness_dict = bussiness_create.model_dump()
        bussiness_dict["open_hours"] = bussiness_create.open_hours.model_dump()
        bussiness_dict["created_at"] = datetime.utcnow()
        bussiness_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(bussiness_dict)
        created_bussiness = await self.get_by_id(str(result.inserted_id))
        
        # Create user_bussiness relationship with owner role
        await self.user_bussiness_collection.insert_one({
            "uid": user_id,
            "bid": str(result.inserted_id),
            "role": "owner",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        return Bussiness(
            id=str(created_bussiness.id),
            name=created_bussiness.name,
            description=created_bussiness.description,
            short_description=created_bussiness.short_description,
            open_hours=created_bussiness.open_hours,
            type_id=created_bussiness.type_id,
            l_id=created_bussiness.l_id,
            scheduled_at=created_bussiness.scheduled_at,
            created_at=created_bussiness.created_at,
            updated_at=created_bussiness.updated_at
        )
    
    async def update(self, bussiness_id: str, bussiness_update: BussinessUpdate) -> Bussiness:
        """Update bussiness"""
        bussiness = await self.get_by_id(bussiness_id)
        if not bussiness:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bussiness not found"
            )
        
        update_data = bussiness_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Convert open_hours to dict if present
        if "open_hours" in update_data and update_data["open_hours"]:
            update_data["open_hours"] = update_data["open_hours"].model_dump()
        
        await self.collection.update_one(
            {"_id": ObjectId(bussiness_id)},
            {"$set": update_data}
        )
        
        updated_bussiness = await self.get_by_id(bussiness_id)
        
        return Bussiness(
            id=str(updated_bussiness.id),
            name=updated_bussiness.name,
            description=updated_bussiness.description,
            short_description=updated_bussiness.short_description,
            open_hours=updated_bussiness.open_hours,
            type_id=updated_bussiness.type_id,
            l_id=updated_bussiness.l_id,
            scheduled_at=updated_bussiness.scheduled_at,
            created_at=updated_bussiness.created_at,
            updated_at=updated_bussiness.updated_at
        )
    
    async def delete(self, bussiness_id: str) -> bool:
        """Delete bussiness"""
        if not ObjectId.is_valid(bussiness_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(bussiness_id)})
        
        # Also delete user_bussiness relationships
        await self.user_bussiness_collection.delete_many({"bid": bussiness_id})
        
        return result.deleted_count > 0


bussiness_service = BussinessService()
