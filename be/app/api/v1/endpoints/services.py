from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.service_service import service_service
from app.models.service import Service, ServiceCreate, ServiceUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[Service])
async def list_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    bid: Optional[str] = Query(None, description="Filter by business._id"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List services (pagination, filter by business)"""
    services = await service_service.get_all(
        skip=skip,
        limit=limit,
        bid=bid
    )
    return services


@router.post("/", response_model=Service, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a service for a business"""
    service = await service_service.create(service_data)
    return service


@router.get("/{service_id}", response_model=Service)
async def get_service(
    service_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get service by id"""
    service_obj = await service_service.get_by_id(service_id)
    if not service_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    return Service(
        id=str(service_obj.id),
        name=service_obj.name,
        price=service_obj.price,
        bid=service_obj.bid,
        description=service_obj.description,
        features=service_obj.features,
        short_description=service_obj.short_description,
        metadata=service_obj.metadata
    )


@router.put("/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    service_update: ServiceUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update service"""
    service = await service_service.update(service_id, service_update)
    return service


@router.delete("/{service_id}", response_model=MessageResponse)
async def delete_service(
    service_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete service"""
    success = await service_service.delete(service_id)
    
    if success:
        return MessageResponse(message="Service deleted successfully")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Service not found"
    )
