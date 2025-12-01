from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.business_service import business_service
from app.models.business import business, businessCreate
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.post("/", response_model=business, status_code=status.HTTP_201_CREATED)
async def create_event(
    business_data: businessCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create an event"""
    event_data = businessCreate(
        name=business_data.name,
        description=business_data.description,
        short_description=business_data.short_description,
        open_hours=business_data.open_hours,
        type_id='6927dd74c83ad21b47926941',
        l_id=business_data.l_id,
        position=business_data.position,
        scheduled_at=business_data.scheduled_at
    )
    event = await business_service.create(event_data, current_user_id)
    return event


@router.get("/", response_model=List[business])
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    position_lat: Optional[float] = Query(None, description="Latitude for nearby filter"),
    position_lng: Optional[float] = Query(None, description="Longitude for nearby filter"),
    radius_m: Optional[int] = Query(None, description="Radius in meters"),
    q: Optional[str] = Query(None, description="Search events by name or description"),
    approved: Optional[bool] = Query(None, description="Filter by approval status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List events"""
    events = await business_service.get_all(
        skip=skip,
        limit=limit,
        position_lat=position_lat,
        position_lng=position_lng,
        radius_m=radius_m,
        type_id= '6927dd74c83ad21b47926941',
        approved=approved
        ,
        q=q
    )
    return events