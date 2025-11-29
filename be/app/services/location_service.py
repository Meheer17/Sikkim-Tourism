from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.location import LocationCreate, LocationUpdate, LocationInDB, Location


class LocationService:
    """Service for location operations"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.locations
    
    async def get_by_id(self, location_id: str) -> Optional[LocationInDB]:
        """Get location by ID"""
        if not ObjectId.is_valid(location_id):
            return None
        
        location = await self.collection.find_one({"_id": ObjectId(location_id)})
        if location:
            return LocationInDB(**location)
        return None
    
    async def get_all(self, skip: int = 0, limit: int = 10) -> List[Location]:
        """Get all locations with pagination"""
        cursor = self.collection.find().skip(skip).limit(limit)
        locations = []
        async for location in cursor:
            loc_db = LocationInDB(**location)
            locations.append(Location(
                id=str(loc_db.id),
                name=loc_db.name,
                description=loc_db.description,
                short_description=loc_db.short_description,
                position=loc_db.position,
                metadata=loc_db.metadata,
                type=loc_db.type,
                created_at=loc_db.created_at,
                updated_at=loc_db.updated_at
            ))
        return locations
    
    async def create(self, location_create: LocationCreate) -> Location:
        """Create a new location"""
        location_dict = location_create.model_dump()
        location_dict["created_at"] = datetime.utcnow()
        location_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(location_dict)
        created_location = await self.get_by_id(str(result.inserted_id))
        
        return Location(
            id=str(created_location.id),
            name=created_location.name,
            description=created_location.description,
            short_description=created_location.short_description,
            position=created_location.position,
            metadata=created_location.metadata,
            type=created_location.type,
            created_at=created_location.created_at,
            updated_at=created_location.updated_at
        )
    
    async def update(self, location_id: str, location_update: LocationUpdate) -> Location:
        """Update location"""
        location = await self.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        update_data = location_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Convert position to dict if present
        if "position" in update_data and update_data["position"]:
            update_data["position"] = update_data["position"].model_dump()
        
        await self.collection.update_one(
            {"_id": ObjectId(location_id)},
            {"$set": update_data}
        )
        
        updated_location = await self.get_by_id(location_id)
        
        return Location(
            id=str(updated_location.id),
            name=updated_location.name,
            description=updated_location.description,
            short_description=updated_location.short_description,
            position=updated_location.position,
            metadata=updated_location.metadata,
            type=updated_location.type,
            created_at=updated_location.created_at,
            updated_at=updated_location.updated_at
        )
    
    async def delete(self, location_id: str) -> bool:
        """Delete location"""
        if not ObjectId.is_valid(location_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(location_id)})
        return result.deleted_count > 0


location_service = LocationService()
