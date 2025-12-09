from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.location_service import location_service
from app.models.location import Location, LocationCreate, LocationUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[Location])
async def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    position_lat: Optional[float] = Query(None, description="Latitude for nearby filter"),
    position_lng: Optional[float] = Query(None, description="Longitude for nearby filter"),
    radius_m: int = Query(1000, description="Radius in meters for nearby filter (default 1000)") ,
    q: Optional[str] = Query(None, description="Search locations by name or description"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List locations (pagination). Supports optional nearby filter using
    `position_lat`, `position_lng`, and `radius_m` (meters).
    """
    locations = await location_service.get_all(
        skip=skip,
        limit=limit,
        position_lat=position_lat,
        position_lng=position_lng,
        radius_m=radius_m
        ,
        q=q
    )
    return locations


@router.post("/", response_model=Location, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create location"""
    location = await location_service.create(location_data)
    return location


@router.get("/{l_id}", response_model=Location)
async def get_location(
    l_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get location by id"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"GET /location/{l_id} - requested by user: {current_user_id}")
    
    location = await location_service.get_by_id(l_id)
    if not location:
        logger.warning(f"Location not found: {l_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    logger.info(f"Found location: {location.name} (id: {location.id})")
    
    # Fetch transcriptions for this location
    transcriptions = await location_service.get_transcriptions_for_location(l_id)
    logger.info(f"Fetched {len(transcriptions)} transcriptions for location {l_id}")
    
    response = Location(
        id=str(location.id),
        name=location.name,
        description=location.description,
        short_description=location.short_description,
        position=location.position,
        metadata=location.metadata,
        type=location.type,
        created_at=location.created_at,
        updated_at=location.updated_at,
        transcriptions=transcriptions
    )
    
    logger.info(f"Returning location response with {len(response.transcriptions or [])} transcriptions")
    return response


@router.put("/{l_id}", response_model=Location)
async def update_location(
    l_id: str,
    location_update: LocationUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update location"""
    location = await location_service.update(l_id, location_update)
    return location


@router.delete("/{l_id}", response_model=MessageResponse)
async def delete_location(
    l_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete location"""
    success = await location_service.delete(l_id)
    
    if success:
        return MessageResponse(message="Location deleted successfully")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Location not found"
    )
