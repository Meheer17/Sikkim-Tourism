from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id, get_current_admin_user
from app.services.business_service import business_service
from app.services.business_type_service import business_type_service
from app.models.business import business, businessCreate, businessUpdate, businessType, BusinessWithServices
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[business])
async def list_business(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    position_lat: Optional[float] = Query(None, description="Latitude for nearby filter"),
    position_lng: Optional[float] = Query(None, description="Longitude for nearby filter"),
    radius_m: Optional[int] = Query(None, description="Radius in meters"),
    q: Optional[str] = Query(None, description="Search businesses by name or description"),
    type_id: Optional[str] = Query(None, description="business_TYPE._id filter"),
    approved: Optional[bool] = Query(None, description="Filter by approval status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List businesses (supports pagination, filter by position, type, and approval status)"""
    businesses = await business_service.get_all(
        skip=skip,
        limit=limit,
        position_lat=position_lat,
        position_lng=position_lng,
        radius_m=radius_m,
        type_id=type_id,
        approved=approved
        ,
        q=q
    )
    return businesses

@router.get("/types", response_model=List[businessType])
async def get_business_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all business types"""
    business_types = await business_type_service.get_all(skip=skip, limit=limit)
    return business_types


@router.post("/", response_model=business, status_code=status.HTTP_201_CREATED)
async def create_business(
    business_data: businessCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a business"""
    business = await business_service.create(business_data, current_user_id)
    return business


@router.get("/me", response_model=List[business])
async def get_my_business(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get businesses owned by authenticated user"""
    businesses = await business_service.get_by_owner(current_user_id, skip, limit)
    return businesses


@router.get("/me/complete", response_model=List[BusinessWithServices])
async def get_my_business_with_services(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all businesses owned by authenticated user with all their services nested"""
    businesses = await business_service.get_by_owner_with_services(current_user_id)
    return businesses


@router.get("/types", response_model=List[businessType])
async def get_business_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all business types"""
    business_types = await business_type_service.get_all(skip=skip, limit=limit)
    return business_types


@router.get("/{b_id}", response_model=business)
async def get_business(
    b_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get business by id"""
    business_obj = await business_service.get_by_id(b_id)
    if not business_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="business not found"
        )
    return business(
        id=str(business_obj.id),
        name=business_obj.name,
        description=business_obj.description,
        short_description=business_obj.short_description,
        open_hours=business_obj.open_hours,
        type_id=str(business_obj.type_id),
        l_id=str(business_obj.l_id),
        scheduled_at=business_obj.scheduled_at,
        approved=business_obj.approved,
        created_at=business_obj.created_at,
        updated_at=business_obj.updated_at
    )


@router.put("/{b_id}", response_model=business)
async def update_business(
    b_id: str,
    business_update: businessUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update business"""
    business = await business_service.update(b_id, business_update)
    return business


@router.delete("/{b_id}", response_model=MessageResponse)
async def delete_business(
    b_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete business"""
    success = await business_service.delete(b_id)
    
    if success:
        return MessageResponse(message="business deleted successfully")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="business not found"
    )


@router.put("/{b_id}/approve", response_model=MessageResponse)
async def approve_business(
    b_id: str,
    current_admin_id: str = Depends(get_current_admin_user)
):
    """Approve a business (Admin only)"""
    # Check if business exists
    business = await business_service.get_by_id(b_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="business not found"
        )
    
    # Update business's approved status
    update_data = businessUpdate(approved=True)
    await business_service.update(b_id, update_data)
    
    return MessageResponse(message="business approved successfully")


