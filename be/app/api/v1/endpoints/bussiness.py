from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.bussiness_service import bussiness_service
from app.models.bussiness import Bussiness, BussinessCreate, BussinessUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[Bussiness])
async def list_bussiness(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    position_lat: Optional[float] = Query(None, description="Latitude for nearby filter"),
    position_lng: Optional[float] = Query(None, description="Longitude for nearby filter"),
    radius_m: Optional[int] = Query(None, description="Radius in meters"),
    type_id: Optional[str] = Query(None, description="BUSSINESS_TYPE._id filter"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List businesses (supports pagination, filter by position and/or type)"""
    businesses = await bussiness_service.get_all(
        skip=skip,
        limit=limit,
        position_lat=position_lat,
        position_lng=position_lng,
        radius_m=radius_m,
        type_id=type_id
    )
    return businesses


@router.post("/", response_model=Bussiness, status_code=status.HTTP_201_CREATED)
async def create_bussiness(
    bussiness_data: BussinessCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a business or event (BUSSINESS model)"""
    bussiness = await bussiness_service.create(bussiness_data, current_user_id)
    return bussiness


@router.get("/me", response_model=List[Bussiness])
async def get_my_bussiness(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get businesses owned by authenticated user"""
    businesses = await bussiness_service.get_by_owner(current_user_id, skip, limit)
    return businesses


@router.get("/{b_id}", response_model=Bussiness)
async def get_bussiness(
    b_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get business by id"""
    bussiness = await bussiness_service.get_by_id(b_id)
    if not bussiness:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bussiness not found"
        )
    return Bussiness(
        id=str(bussiness.id),
        name=bussiness.name,
        description=bussiness.description,
        short_description=bussiness.short_description,
        open_hours=bussiness.open_hours,
        type_id=bussiness.type_id,
        l_id=bussiness.l_id,
        scheduled_at=bussiness.scheduled_at,
        created_at=bussiness.created_at,
        updated_at=bussiness.updated_at
    )


@router.put("/{b_id}", response_model=Bussiness)
async def update_bussiness(
    b_id: str,
    bussiness_update: BussinessUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update business"""
    bussiness = await bussiness_service.update(b_id, bussiness_update)
    return bussiness


@router.delete("/{b_id}", response_model=MessageResponse)
async def delete_bussiness(
    b_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete business"""
    success = await bussiness_service.delete(b_id)
    
    if success:
        return MessageResponse(message="Bussiness deleted successfully")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Bussiness not found"
    )
