from typing import List
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
    current_user_id: str = Depends(get_current_user_id)
):
    """List locations (pagination)"""
    locations = await location_service.get_all(skip, limit)
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
    location = await location_service.get_by_id(l_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return Location(
        id=str(location.id),
        name=location.name,
        description=location.description,
        short_description=location.short_description,
        position=location.position,
        metadata=location.metadata,
        type=location.type,
        created_at=location.created_at,
        updated_at=location.updated_at
    )


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
