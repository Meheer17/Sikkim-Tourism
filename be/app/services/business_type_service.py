from typing import Optional, List
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.business import businessTypeCreate, businessTypeUpdate, businessTypeInDB, businessType


class businessTypeService:
    """Service for business type operations"""

    def __init__(self):
        pass

    async def get_by_id(self, type_id: str) -> Optional[businessTypeInDB]:
        """Get business type by ID"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business_type
        if not ObjectId.is_valid(type_id):
            return None

        business_type = await collection.find_one({"_id": ObjectId(type_id)})
        if business_type:
            return businessTypeInDB(**business_type)
        return None

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[businessType]:
        """Get all business types with pagination"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business_type

        cursor = collection.find().skip(skip).limit(limit)
        business_types = []
        async for business_type in cursor:
            type_db = businessTypeInDB(**business_type)
            business_types.append(businessType(
                id=str(type_db.id),
                type=type_db.type,
                category=type_db.category
            ))
        return business_types

    async def create(self, business_type_create: businessTypeCreate) -> businessType:
        """Create a new business type"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business_type

        # Check if type already exists
        existing_type = await collection.find_one({
            "type": business_type_create.type,
            "category": business_type_create.category
        })
        if existing_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="business type already exists"
            )

        business_type_dict = business_type_create.model_dump()
        result = await collection.insert_one(business_type_dict)
        created_type = await self.get_by_id(str(result.inserted_id))

        return businessType(
            id=str(created_type.id),
            type=created_type.type,
            category=created_type.category
        )

    async def update(self, type_id: str, business_type_update: businessTypeUpdate) -> businessType:
        """Update business type"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business_type
        business_type = await self.get_by_id(type_id)
        if not business_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="business type not found"
            )

        update_data = business_type_update.model_dump(exclude_unset=True)

        await collection.update_one(
            {"_id": ObjectId(type_id)},
            {"$set": update_data}
        )

        updated_type = await self.get_by_id(type_id)

        return businessType(
            id=str(updated_type.id),
            type=updated_type.type,
            category=updated_type.category
        )

    async def delete(self, type_id: str) -> bool:
        """Delete business type"""
        db = get_database()
        if db is None:
            return False
        collection = db.business_type
        if not ObjectId.is_valid(type_id):
            return False

        result = await collection.delete_one({"_id": ObjectId(type_id)})
        return result.deleted_count > 0


business_type_service = businessTypeService()