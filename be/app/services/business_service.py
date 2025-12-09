from typing import Optional, List
from datetime import datetime
import math
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.business import businessCreate, businessUpdate, businessInDB, business
from app.models.location import LocationCreate, LocationType
from app.models.user_relations import UserBusinessInDB
from app.services.location_service import location_service


class businessService:
    """Service for business operations"""
    
    def __init__(self):
        pass
    
    async def _get_owner_uid(self, business_id: str) -> Optional[str]:
        """Helper method to get owner uid for a business"""
        db = get_database()
        if db is None:
            return None
        user_business_collection = db.user_business
        user_business = await user_business_collection.find_one({
            "bid": business_id,
            "role": "owner"
        })
        if user_business:
            return str(user_business.get("uid"))
        return None
    
    async def get_by_id(self, business_id: str) -> Optional[businessInDB]:
        """Get business by ID"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business
        if not ObjectId.is_valid(business_id):
            return None
        
        business = await collection.find_one({"_id": ObjectId(business_id)})
        if business:
            return businessInDB(**business)
        return None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        position_lat: Optional[float] = None,
        position_lng: Optional[float] = None,
        radius_m: Optional[int] = None,
        type_id: Optional[str] = None,
        approved: Optional[bool] = None
        ,
        q: Optional[str] = None
    ) -> List[business]:
        """Get all businesses with pagination and filters"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business
        query = {}

        # text search
        if q:
            q_str = q.strip()
            if q_str:
                query["$or"] = [
                    {"name": {"$regex": q_str, "$options": "i"}},
                    {"description": {"$regex": q_str, "$options": "i"}},
                    {"short_description": {"$regex": q_str, "$options": "i"}},
                ]

        if type_id:
            query["type_id"] = ObjectId(type_id)
            
        if approved is not None:
            if approved:
                query["approved"] = True
            else:
                query["$or"] = [
                    {"approved": False},
                    {"approved": {"$exists": False}}
                ]
        sort_criteria = [("created_at", -1)]
        
        # Position filter: find locations in bbox and filter businesses by l_id
        if position_lat is not None and position_lng is not None and radius_m is not None:
            # compute bbox (similar to location_service)
            deg_lat = radius_m / 111320.0
            lat_rad = math.radians(position_lat)
            deg_lng = radius_m / (111320.0 * max(0.000001, math.cos(lat_rad)))
            min_lat = position_lat - deg_lat
            max_lat = position_lat + deg_lat
            min_lng = position_lng - deg_lng
            max_lng = position_lng + deg_lng

            # find matching locations
            locs = get_database().locations.find({
                "position.x": {"$gte": min_lng, "$lte": max_lng},
                "position.y": {"$gte": min_lat, "$lte": max_lat}
            })
            location_ids = []
            async for l in locs:
                # l._id might be ObjectId; store as string for l_id matching
                location_ids.append(str(l.get("_id")))
            if location_ids:
                query["l_id"] = {"$in": location_ids}

        cursor = collection.find(query).sort(sort_criteria).skip(skip).limit(limit)
        businesses = []
        user_business_collection = db.user_business
        async for doc in cursor:
            bus_db = businessInDB(**doc)
            # Get owner uid from user_business collection
            owner_uid = None
            user_business = await user_business_collection.find_one({
                "bid": str(bus_db.id),
                "role": "owner"
            })
            if user_business:
                owner_uid = str(user_business.get("uid"))
            
            businesses.append(business(
                id=str(bus_db.id),
                name=bus_db.name,
                description=bus_db.description,
                short_description=bus_db.short_description,
                open_hours=bus_db.open_hours,
                type_id=str(bus_db.type_id),
                l_id=str(bus_db.l_id),
                scheduled_at=bus_db.scheduled_at,
                approved=bus_db.approved,
                created_at=bus_db.created_at,
                updated_at=bus_db.updated_at,
                uid=owner_uid
            ))
        return businesses
    
    async def get_by_owner(self, user_id: str, skip: int = 0, limit: int = 10, type_id: Optional[str] = None) -> List[business]:
        """Get businesses owned by a user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business
        user_business_collection = db.user_business
        cursor = user_business_collection.find({
            "uid": ObjectId(user_id),
            "role": "owner"
        })
        
        business_ids = []
        async for ub in cursor:
            business_ids.append(ObjectId(ub["bid"]))
        
        if not business_ids:
            return []
        
        # Build query
        query = {"_id": {"$in": business_ids}}
        if type_id:
            query["type_id"] = ObjectId(type_id)
        
        # Get the businesses
        cursor = collection.find(query).sort([("created_at", -1)]).skip(skip).limit(limit)
        businesses = []
        async for doc in cursor:
            bus_db = businessInDB(**doc)
            # Get owner uid from user_business collection
            owner_uid = None
            user_business = await user_business_collection.find_one({
                "bid": str(bus_db.id),
                "role": "owner"
            })
            if user_business:
                owner_uid = str(user_business.get("uid"))
            
            businesses.append(business(
                id=str(bus_db.id),
                name=bus_db.name,
                description=bus_db.description,
                short_description=bus_db.short_description,
                open_hours=bus_db.open_hours,
                type_id=str(bus_db.type_id),
                l_id=str(bus_db.l_id),
                scheduled_at=bus_db.scheduled_at,
                approved=bus_db.approved,
                created_at=bus_db.created_at,
                updated_at=bus_db.updated_at,
                uid=owner_uid
            ))
        return businesses
    
    async def create(self, business_create: businessCreate, user_id: str, event=False) -> business:
        """Create a new business"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business
        user_business_collection = db.user_business
        users_collection = db.users
        l_id = business_create.l_id
        if not l_id:
            location_create = LocationCreate(
                name=business_create.name,
                description=business_create.description,
                short_description=business_create.short_description,
                position=business_create.position,
                metadata={},
                type=LocationType.business
            )
            location = await location_service.create(location_create)
            l_id = location.id
        
        business_dict = business_create.model_dump()
        business_dict["l_id"] = l_id
        business_dict["open_hours"] = business_create.open_hours.model_dump()
        business_dict["created_at"] = datetime.utcnow()
        business_dict["updated_at"] = datetime.utcnow()
        business_in_db = businessInDB(**business_dict)
        business_dict = business_in_db.model_dump(exclude={"id"})
        
        result = await collection.insert_one(business_dict)
        created_business = await self.get_by_id(str(result.inserted_id))
        
        user_business_data = {
            "uid": user_id,
            "bid": str(result.inserted_id),
            "role": "owner",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        user_business_in_db = UserBusinessInDB(**user_business_data)
        await user_business_collection.insert_one(user_business_in_db.model_dump(exclude={"id"}))
        if (not event):
            user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user_doc and user_doc.get("role") != "government":
                await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"role": "business", "updated_at": datetime.utcnow()}}
                )
        
        return business(
            id=str(created_business.id),
            name=created_business.name,
            description=created_business.description,
            short_description=created_business.short_description,
            open_hours=created_business.open_hours,
            type_id=str(created_business.type_id),
            l_id=str(created_business.l_id),
            scheduled_at=created_business.scheduled_at,
            approved=created_business.approved,
            created_at=created_business.created_at,
            updated_at=created_business.updated_at,
            uid=user_id
        )
    
    async def update(self, business_id: str, business_update: businessUpdate) -> business:
        """Update business"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.business
        existing_business = await self.get_by_id(business_id)
        if not existing_business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="business not found"
            )
        
        update_data = business_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(business_id)},
            {"$set": update_data}
        )
        
        updated_business = await self.get_by_id(business_id)
        owner_uid = await self._get_owner_uid(business_id)
        
        return business(
            id=str(updated_business.id),
            name=updated_business.name,
            description=updated_business.description,
            short_description=updated_business.short_description,
            open_hours=updated_business.open_hours,
            type_id=str(updated_business.type_id),
            l_id=str(updated_business.l_id),
            scheduled_at=updated_business.scheduled_at,
            approved=updated_business.approved,
            created_at=updated_business.created_at,
            updated_at=updated_business.updated_at,
            uid=owner_uid
        )
    
    async def delete(self, business_id: str) -> bool:
        """Delete business"""
        db = get_database()
        if db is None:
            return False
        collection = db.business
        user_business_collection = db.user_business
        if not ObjectId.is_valid(business_id):
            return False
        
        result = await collection.delete_one({"_id": ObjectId(business_id)})
        
        # Also delete user_business relationships
        await user_business_collection.delete_many({"bid": business_id})
        
        return result.deleted_count > 0
    
    async def get_by_owner_with_services(self, user_id: str) -> List:
        """Get all businesses owned by user with their services"""
        from app.models.business import BusinessWithServices, ServiceInBusiness
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        
        business_collection = db.business
        user_business_collection = db.user_business
        services_collection = db.services
        
        # Get all business IDs owned by user
        business_ids = []
        cursor = user_business_collection.find({
            "uid": user_id,
            "role": "owner"
        })
        async for ub in cursor:
            business_ids.append(ub["bid"])
        
        if not business_ids:
            return []
        
        # Get businesses
        businesses_with_services = []
        cursor = business_collection.find({"_id": {"$in": [ObjectId(bid) for bid in business_ids]}}).sort([("created_at", -1)])
        
        async for doc in cursor:
            bus_db = businessInDB(**doc)
            
            # Get services for this business
            services = []
            services_cursor = services_collection.find({"bid": str(bus_db.id)})
            async for service_doc in services_cursor:
                services.append(ServiceInBusiness(
                    id=str(service_doc.get("_id")),
                    name=service_doc.get("name"),
                    price=service_doc.get("price"),
                    description=service_doc.get("description"),
                    features=service_doc.get("features"),
                    short_description=service_doc.get("short_description"),
                    metadata=service_doc.get("metadata")
                ))
            
            # Create BusinessWithServices object
            biz_with_services = BusinessWithServices(
                id=str(bus_db.id),
                name=bus_db.name,
                description=bus_db.description,
                short_description=bus_db.short_description,
                open_hours=bus_db.open_hours,
                type_id=str(bus_db.type_id),
                l_id=str(bus_db.l_id),
                scheduled_at=bus_db.scheduled_at,
                approved=bus_db.approved,
                created_at=bus_db.created_at,
                updated_at=bus_db.updated_at,
                services=services
            )
            businesses_with_services.append(biz_with_services)
        
        return businesses_with_services


business_service = businessService()
