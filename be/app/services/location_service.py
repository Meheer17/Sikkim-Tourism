from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
import math

from app.core.database import get_database
from app.models.location import LocationCreate, LocationUpdate, LocationInDB, Location

DEFAULT_RADIUS_M = 1000  # meters


class LocationService:
    """Service for location operations"""
    
    @property
    def db(self):
        return get_database()
    
    @property
    def collection(self):
        return self.db.locations
    
    async def get_by_id(self, location_id: str) -> Optional[LocationInDB]:
        """Get location by ID"""
        if not ObjectId.is_valid(location_id):
            return None
        
        location = await self.collection.find_one({"_id": ObjectId(location_id)})
        if location:
            return LocationInDB(**location)
        return None
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        position_lat: Optional[float] = None,
        position_lng: Optional[float] = None,
        radius_m: Optional[int] = None,
        q: Optional[str] = None
    ) -> List[Location]:
        """Get all locations with pagination and optional nearby filtering.

        Note: This implementation assumes that `position.x` is longitude and
        `position.y` is latitude (x = lng, y = lat). If your data uses the
        opposite convention, let me know and I can swap the coordinates.
        """
        query = {}
        # text search on name/description/short_description
        if q:
            q_str = q.strip()
            if q_str:
                query["$or"] = [
                    {"name": {"$regex": q_str, "$options": "i"}},
                    {"description": {"$regex": q_str, "$options": "i"}},
                    {"short_description": {"$regex": q_str, "$options": "i"}},
                ]

        # apply default radius if position provided but radius omitted
        if position_lat is not None and position_lng is not None and radius_m is None:
            radius_m = DEFAULT_RADIUS_M

        use_nearby = position_lat is not None and position_lng is not None and radius_m is not None
        if use_nearby:

            deg_lat = radius_m / 111320.0
            lat_rad = math.radians(position_lat)
            deg_lng = radius_m / (111320.0 * max(0.000001, math.cos(lat_rad)))

            min_lat = position_lat - deg_lat
            max_lat = position_lat + deg_lat
            min_lng = position_lng - deg_lng
            max_lng = position_lng + deg_lng

            query["position.x"] = {"$gte": min_lng, "$lte": max_lng}
            query["position.y"] = {"$gte": min_lat, "$lte": max_lat}

        cursor = self.collection.find(query).skip(0)

        candidates = []
        async for location in cursor:
            candidates.append(location)

        results: List[tuple[float, Location]] = []

        def haversine_m(lat1, lon1, lat2, lon2):
            # returns distance in meters
            R = 6371000.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        for location in candidates:
            try:
                loc_db = LocationInDB(**location)
            except Exception:
                continue

            if use_nearby:
                # extract coordinates (assume x=lng, y=lat)
                pos = loc_db.position
                # position may be a dict (from raw db) or a pydantic Position model
                if not pos:
                    continue
                if isinstance(pos, dict):
                    lng = pos.get("x")
                    lat = pos.get("y")
                else:
                    # pydantic model or object with attributes
                    lng = getattr(pos, "x", None)
                    lat = getattr(pos, "y", None)
                if lat is None or lng is None:
                    continue
                dist = haversine_m(position_lat, position_lng, lat, lng)
                if dist <= radius_m:
                    results.append((dist, Location(
                        id=str(loc_db.id),
                        name=loc_db.name,
                        description=loc_db.description,
                        short_description=loc_db.short_description,
                        position=loc_db.position,
                        metadata=loc_db.metadata,
                        type=loc_db.type,
                        created_at=loc_db.created_at,
                        updated_at=loc_db.updated_at
                    )))
            else:
                # no nearby filter, just include
                results.append((0.0, Location(
                    id=str(loc_db.id),
                    name=loc_db.name,
                    description=loc_db.description,
                    short_description=loc_db.short_description,
                    position=loc_db.position,
                    metadata=loc_db.metadata,
                    type=loc_db.type,
                    created_at=loc_db.created_at,
                    updated_at=loc_db.updated_at
                )))

        # sort by distance (if nearby), otherwise by created order as in original (we have 0.0 for all)
        results.sort(key=lambda x: x[0])

        # apply skip/limit
        sliced = results[skip: skip + limit]

        return [item[1] for item in sliced]
    
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
        
        # Convert position to dict if present (only if it's a Pydantic model)
        if "position" in update_data and update_data["position"]:
            if hasattr(update_data["position"], "model_dump"):
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
