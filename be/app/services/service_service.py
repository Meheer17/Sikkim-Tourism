from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.service import ServiceCreate, ServiceUpdate, ServiceInDB, Service


class ServiceService:
    """Service for SERVICES collection operations"""
    
    def __init__(self):
        pass
    
    async def get_by_id(self, service_id: str) -> Optional[ServiceInDB]:
        """Get service by ID"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.services
        if not ObjectId.is_valid(service_id):
            return None
        
        service = await collection.find_one({"_id": ObjectId(service_id)})
        if service:
            return ServiceInDB(**service)
        return None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        bid: Optional[str] = None
    ) -> List[Service]:
        """Get all services with pagination and filters"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.services
        query = {}
        
        if bid:
            if not ObjectId.is_valid(bid):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid business ID")
            query["bid"] = bid
        
        cursor = collection.find(query).skip(skip).limit(limit)
        services = []
        async for doc in cursor:
            service_db = ServiceInDB(**doc)
            services.append(Service(
                id=str(service_db.id),
                name=service_db.name,
                price=service_db.price,
                bid=service_db.bid,
                description=service_db.description,
                features=service_db.features,
                short_description=service_db.short_description,
                metadata=service_db.metadata
            ))
        return services
    
    async def create(self, service_data: ServiceCreate) -> Service:
        """Create a new service"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.services
        
        # Verify that the business exists
        business = await db.business.find_one({"_id": ObjectId(service_data.bid)})
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        service_dict = service_data.model_dump(by_alias=True, exclude_unset=True)
        result = await collection.insert_one(service_dict)
        
        created_service = await self.get_by_id(str(result.inserted_id))
        if not created_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create service"
            )
        
        return Service(
            id=str(created_service.id),
            name=created_service.name,
            price=created_service.price,
            bid=created_service.bid,
            description=created_service.description,
            features=created_service.features,
            short_description=created_service.short_description,
            metadata=created_service.metadata
        )
    
    async def update(self, service_id: str, service_update: ServiceUpdate) -> Service:
        """Update a service"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.services
        
        if not ObjectId.is_valid(service_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service ID")
        
        # Check if service exists
        existing_service = await self.get_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # If bid is being updated, verify the new business exists
        if service_update.bid:
            business = await db.business.find_one({"_id": ObjectId(service_update.bid)})
            if not business:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Business not found"
                )
        
        update_dict = service_update.model_dump(by_alias=True, exclude_unset=True, exclude_none=True)
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        await collection.update_one(
            {"_id": ObjectId(service_id)},
            {"$set": update_dict}
        )
        
        updated_service = await self.get_by_id(service_id)
        if not updated_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update service"
            )
        
        return Service(
            id=str(updated_service.id),
            name=updated_service.name,
            price=updated_service.price,
            bid=updated_service.bid,
            description=updated_service.description,
            features=updated_service.features,
            short_description=updated_service.short_description,
            metadata=updated_service.metadata
        )
    
    async def delete(self, service_id: str) -> bool:
        """Delete a service"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.services
        
        if not ObjectId.is_valid(service_id):
            return False
        
        result = await collection.delete_one({"_id": ObjectId(service_id)})
        return result.deleted_count > 0


service_service = ServiceService()
