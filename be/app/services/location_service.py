from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
import math

from app.core.database import get_database
from app.models.location import LocationCreate, LocationUpdate, LocationInDB, Location, TranscriptionSummary

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
    
    async def get_transcriptions_for_location(self, location_id: str) -> List[TranscriptionSummary]:
        """Get transcriptions for files associated with this location"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Fetching transcriptions for location_id: {location_id}")
        
        if not ObjectId.is_valid(location_id):
            logger.warning(f"Invalid ObjectId for location: {location_id}")
            return []
        
        location_obj_id = ObjectId(location_id)
        logger.info(f"Converted to ObjectId: {location_obj_id}")
        
        # Find all transcriptions where l_id matches this location
        query = {"l_id": location_obj_id}
        logger.info(f"Querying transcriptions collection with: {query}")
        
        transcriptions_cursor = self.db.transcriptions.find(
            query,
            {"_id": 1, "text": 1, "avg_confidence": 1, "file_name": 1, "created_at": 1, "l_id": 1}
        ).sort("created_at", -1)  # Most recent first
        
        transcriptions = []
        count = 0
        async for trans in transcriptions_cursor:
            count += 1
            logger.info(f"Found transcription {count}: _id={trans['_id']}, l_id={trans.get('l_id')}, file_name={trans.get('file_name')}, text_length={len(trans.get('text', ''))}")
            transcriptions.append(TranscriptionSummary(
                id=str(trans["_id"]),
                text=trans.get("text", ""),
                avg_confidence=trans.get("avg_confidence"),
                file_name=trans.get("file_name"),
                created_at=trans.get("created_at", datetime.utcnow())
            ))
        
        logger.info(f"Total transcriptions found for location {location_id}: {len(transcriptions)}")
        return transcriptions
    
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
        
        # For nearby searches, we need to fetch all candidates first because:
        # 1. The bounding box is an approximation
        # 2. We need to calculate precise haversine distances
        # 3. We need to filter by actual radius and sort by distance
        # 4. Only then can we apply skip/limit correctly
        # For non-nearby searches we can perform a single aggregation that
        # looks up transcriptions server-side which avoids Python-side loops.
        if not use_nearby:
            # Build aggregation pipeline: match -> sort -> skip -> limit -> lookup transcriptions
            pipeline = []
            if query:
                pipeline.append({"$match": query})
            # maintain DB ordering; change sort as needed
            pipeline.extend([
                {"$sort": {"created_at": -1}},
                {"$skip": skip},
                {"$limit": limit},
                {"$lookup": {
                    "from": "transcriptions",
                    "let": {"loc_id": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$l_id", "$$loc_id"]}}},
                        {"$sort": {"created_at": -1}},
                        {"$project": {"_id": 1, "text": 1, "avg_confidence": 1, "file_name": 1, "created_at": 1, "l_id": 1}}
                    ],
                    "as": "transcriptions"
                }},
            ])

            locations_list: List[Location] = []
            agg_cursor = self.collection.aggregate(pipeline)
            async for doc in agg_cursor:
                try:
                    loc_db = LocationInDB(**doc)
                except Exception:
                    # If doc isn't shaped like LocationInDB, try to construct from fields
                    loc_db = None
                # build base Location
                loc = Location(
                    id=str(doc.get('_id') if loc_db is None else loc_db.id),
                    name=doc.get('name') if loc_db is None else loc_db.name,
                    description=doc.get('description') if loc_db is None else loc_db.description,
                    short_description=doc.get('short_description') if loc_db is None else loc_db.short_description,
                    position=doc.get('position') if loc_db is None else loc_db.position,
                    metadata=doc.get('metadata') if loc_db is None else loc_db.metadata,
                    type=doc.get('type') if loc_db is None else loc_db.type,
                    created_at=doc.get('created_at') if doc.get('created_at') else (loc_db.created_at if loc_db else datetime.utcnow()),
                    updated_at=doc.get('updated_at') if doc.get('updated_at') else (loc_db.updated_at if loc_db else datetime.utcnow()),
                    transcriptions=[]
                )
                # attach transcriptions returned by $lookup
                trans_list = doc.get('transcriptions') or []
                summaries: List[TranscriptionSummary] = []
                for t in trans_list:
                    summaries.append(TranscriptionSummary(
                        id=str(t.get('_id')),
                        text=t.get('text', ''),
                        avg_confidence=t.get('avg_confidence'),
                        file_name=t.get('file_name'),
                        created_at=t.get('created_at') or datetime.utcnow()
                    ))
                loc.transcriptions = summaries
                locations_list.append(loc)

            return locations_list

        # nearby case falls back to scanning candidates and computing haversine distances
        cursor = self.collection.find(query) if use_nearby else self.collection.find(query)

        candidates = []
        async for location in cursor:
            candidates.append(location)

        results: List[tuple[float, Location]] = []

        def haversine_m(lat1, lon1, lat2, lon2):
            R = 6371000.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        for location in candidates:
            print(location)
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
                        updated_at=loc_db.updated_at,
                        transcriptions=[]
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
                    updated_at=loc_db.updated_at,
                    transcriptions=[]
                )))

        # sort by distance (if nearby), otherwise by created order as in original (we have 0.0 for all)
        results.sort(key=lambda x: x[0])

        # apply skip/limit only for nearby searches (non-nearby already applied at DB level)
        if use_nearby:
            sliced = results[skip: skip + limit]
        else:
            sliced = results

        # Build list of Location objects
        locations_list = [item[1] for item in sliced]

        # Attach transcriptions for all returned locations in a single batched query
        try:
            loc_obj_ids = []
            for item in sliced:
                # original candidate dict may be inside the LocationInDB conversion; try to extract id
                try:
                    # item[1] is a Location Pydantic model; its id is string
                    loc_obj_ids.append(ObjectId(item[1].id))
                except Exception:
                    # fallback: if we have raw dict in candidates, try to read _id
                    try:
                        loc_obj_ids.append(ObjectId(item[1].get('id')))
                    except Exception:
                        pass

            if loc_obj_ids:
                trans_cursor = self.db.transcriptions.find(
                    {"l_id": {"$in": loc_obj_ids}},
                    {"_id": 1, "text": 1, "avg_confidence": 1, "file_name": 1, "created_at": 1, "l_id": 1}
                )
                trans_by_loc = {}
                async for t in trans_cursor:
                    lid = t.get('l_id')
                    if isinstance(lid, ObjectId):
                        key = str(lid)
                    else:
                        key = str(lid)
                    trans_by_loc.setdefault(key, []).append(TranscriptionSummary(
                        id=str(t.get('_id')),
                        text=t.get('text', ''),
                        avg_confidence=t.get('avg_confidence'),
                        file_name=t.get('file_name'),
                        created_at=t.get('created_at') or datetime.utcnow()
                    ))

                # attach to corresponding Location objects
                for loc in locations_list:
                    loc.transcriptions = trans_by_loc.get(loc.id, [])
        except Exception:
            # if transcription fetch fails, continue without transcriptions
            pass

        return locations_list
    
    async def create(self, location_create: LocationCreate) -> Location:
        """Create a new location"""
        location_dict = location_create.model_dump()
        
        # Convert Position object to dict if needed
        if "position" in location_dict:
            pos = location_dict["position"]
            if hasattr(pos, "dict"):
                location_dict["position"] = pos.dict()
            elif isinstance(pos, dict):
                location_dict["position"] = pos
            else:
                location_dict["position"] = {"x": pos.x, "y": pos.y}
        
        location_dict["created_at"] = datetime.utcnow()
        location_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(location_dict)
        created_location = await self.get_by_id(str(result.inserted_id))
        
        # Fetch transcriptions for the newly created location
        transcriptions = await self.get_transcriptions_for_location(str(result.inserted_id))
        
        return Location(
            id=str(created_location.id),
            name=created_location.name,
            description=created_location.description,
            short_description=created_location.short_description,
            position=created_location.position,
            metadata=created_location.metadata,
            type=created_location.type,
            created_at=created_location.created_at,
            updated_at=created_location.updated_at,
            transcriptions=transcriptions
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
        
        # Fetch transcriptions for the updated location
        transcriptions = await self.get_transcriptions_for_location(location_id)
        
        return Location(
            id=str(updated_location.id),
            name=updated_location.name,
            description=updated_location.description,
            short_description=updated_location.short_description,
            position=updated_location.position,
            metadata=updated_location.metadata,
            type=updated_location.type,
            created_at=updated_location.created_at,
            updated_at=updated_location.updated_at,
            transcriptions=transcriptions
        )
    
    async def delete(self, location_id: str) -> bool:
        """Delete location"""
        if not ObjectId.is_valid(location_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(location_id)})
        return result.deleted_count > 0


location_service = LocationService()
