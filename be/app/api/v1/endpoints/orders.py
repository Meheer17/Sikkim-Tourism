from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.order_service import order_service
from app.models.order import Order, OrderCreate, OrderUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()


# CREATE - must come first before GET
@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new order for a service
    
    Parameters:
    - service_id: ID of the service to order
    - business_id: ID of the business providing the service
    - amount: Order amount
    - metadata: Optional metadata (e.g., from_time, to_time, quantity, etc.)
    """
    try:
        order = await order_service.create(order_data, current_user_id)
        return order
    except Exception as e:
        print(f"[ERROR] Failed to create order: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# READ LIST - specific routes before generic ones
@router.get("/me", response_model=List[Order])
async def get_my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get orders for authenticated user"""
    orders = await order_service.get_by_user(current_user_id, skip, limit)
    return orders


@router.get("/business/{business_id}", response_model=List[Order])
async def get_business_orders(
    business_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all orders for a specific business"""
    orders = await order_service.get_by_business(business_id, skip, limit)
    return orders


# Generic GET - comes last
@router.get("/", response_model=List[Order])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    service_id: Optional[str] = Query(None, description="Filter by service._id"),
    business_id: Optional[str] = Query(None, description="Filter by business._id"),
    user_id: Optional[str] = Query(None, description="Filter by user._id"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    order_status: Optional[str] = Query(None, description="Filter by order status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """List orders with pagination and filters"""
    orders = await order_service.get_all(
        skip=skip,
        limit=limit,
        service_id=service_id,
        business_id=business_id,
        user_id=user_id,
        payment_status=payment_status,
        order_status=order_status
    )
    return orders


@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get order by id"""
    order_obj = await order_service.get_by_id(order_id)
    if not order_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return Order(
        id=str(order_obj.id),
        service_id=order_obj.service_id,
        business_id=order_obj.business_id,
        user_id=order_obj.user_id,
        payment_status=order_obj.payment_status,
        order_status=order_obj.order_status,
        amount=order_obj.amount,
        metadata=order_obj.metadata,
        created_at=order_obj.created_at,
        updated_at=order_obj.updated_at
    )


@router.put("/{order_id}", response_model=Order)
async def update_order(
    order_id: str,
    order_update: OrderUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update order (payment status, order status, metadata, etc.)"""
    order = await order_service.update(order_id, order_update)
    return order


@router.delete("/{order_id}", response_model=MessageResponse)
async def delete_order(
    order_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete order"""
    success = await order_service.delete(order_id)
    
    if success:
        return MessageResponse(message="Order deleted successfully")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Order not found"
    )
