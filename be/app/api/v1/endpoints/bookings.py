from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from datetime import datetime, date

from app.core.security import get_current_user_id
from app.services.order_service import order_service
from app.models.order import Order
from app.schemas.auth import MessageResponse

router = APIRouter()


# ==================== USER BOOKINGS ====================

@router.get("/user/my-bookings", response_model=List[Order])
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    order_status: Optional[str] = Query(None, description="Filter by order status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all bookings for authenticated user
    
    Retrieves all orders (bookings) created by the authenticated user.
    Can be filtered by order status and payment status.
    """
    bookings = await order_service.get_by_user(
        user_id=current_user_id,
        skip=skip,
        limit=limit,
        order_status=order_status,
        payment_status=payment_status
    )
    return bookings


@router.get("/user/my-bookings/count", response_model=dict)
async def get_my_bookings_count(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get count of user's bookings by status"""
    count = await order_service.get_user_bookings_count(current_user_id)
    return count


@router.get("/user/my-bookings/upcoming", response_model=List[Order])
async def get_upcoming_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get upcoming bookings for authenticated user (not yet completed)"""
    bookings = await order_service.get_user_upcoming_bookings(
        user_id=current_user_id,
        skip=skip,
        limit=limit
    )
    return bookings


@router.get("/user/my-bookings/completed", response_model=List[Order])
async def get_completed_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get completed bookings for authenticated user"""
    bookings = await order_service.get_user_completed_bookings(
        user_id=current_user_id,
        skip=skip,
        limit=limit
    )
    return bookings


# ==================== BUSINESS BOOKINGS ====================

@router.get("/business/today", response_model=List[Order])
async def get_todays_bookings(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get today's bookings for all businesses owned by authenticated user
    
    This endpoint:
    1. Gets all businesses owned by the user from user_business collection
    2. Retrieves all orders for those businesses created today
    3. Returns with pagination and filters
    """
    bookings = await order_service.get_todays_bookings_for_user_businesses(current_user_id)
    return bookings


@router.get("/business/today/count", response_model=dict)
async def get_todays_bookings_count(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get count of today's bookings for user's businesses"""
    count = await order_service.get_todays_bookings_count_for_user_businesses(current_user_id)
    return count


@router.get("/business/upcoming", response_model=List[Order])
async def get_business_upcoming_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get upcoming bookings for all businesses owned by authenticated user"""
    bookings = await order_service.get_upcoming_bookings_for_user_businesses(
        current_user_id,
        skip=skip,
        limit=limit
    )
    return bookings


@router.get("/business/pending-payment", response_model=List[Order])
async def get_pending_payment_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get bookings with pending payment for all businesses owned by authenticated user"""
    bookings = await order_service.get_pending_payment_bookings_for_user_businesses(
        current_user_id,
        skip=skip,
        limit=limit
    )
    return bookings


@router.get("/business/{business_id}/bookings", response_model=List[Order])
async def get_business_bookings(
    business_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    order_status: Optional[str] = Query(None, description="Filter by order status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all bookings for a specific business
    
    Only business owner can access this endpoint.
    """
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business's bookings"
        )
    
    bookings = await order_service.get_business_bookings(
        business_id=business_id,
        skip=skip,
        limit=limit,
        order_status=order_status,
        payment_status=payment_status
    )
    return bookings


@router.get("/business/{business_id}/today", response_model=List[Order])
async def get_business_todays_bookings(
    business_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get today's bookings for a specific business
    
    Only business owner can access this endpoint.
    """
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business's bookings"
        )
    
    bookings = await order_service.get_business_todays_bookings(business_id)
    return bookings


@router.put("/business/{business_id}/booking/{order_id}/confirm", response_model=Order)
async def confirm_booking(
    business_id: str,
    order_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Confirm a booking (business owner only)"""
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business"
        )
    
    # Verify order belongs to this business
    order_obj = await order_service.get_by_id(order_id)
    if not order_obj or order_obj.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found for this business"
        )
    
    from app.models.order import OrderUpdate, OrderStatus
    booking = await order_service.update(
        order_id,
        OrderUpdate(order_status=OrderStatus.confirmed)
    )
    return booking


@router.put("/business/{business_id}/booking/{order_id}/mark-completed", response_model=Order)
async def mark_booking_completed(
    business_id: str,
    order_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Mark a booking as completed (business owner only)"""
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business"
        )
    
    # Verify order belongs to this business
    order_obj = await order_service.get_by_id(order_id)
    if not order_obj or order_obj.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found for this business"
        )
    
    from app.models.order import OrderUpdate, OrderStatus
    booking = await order_service.update(
        order_id,
        OrderUpdate(order_status=OrderStatus.completed)
    )
    return booking


@router.put("/business/{business_id}/booking/{order_id}/cancel", response_model=Order)
async def cancel_booking(
    business_id: str,
    order_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Cancel a booking (business owner only)"""
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business"
        )
    
    # Verify order belongs to this business
    order_obj = await order_service.get_by_id(order_id)
    if not order_obj or order_obj.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found for this business"
        )
    
    from app.models.order import OrderUpdate, OrderStatus
    booking = await order_service.update(
        order_id,
        OrderUpdate(order_status=OrderStatus.cancelled)
    )
    return booking


@router.get("/business/{business_id}/bookings/count", response_model=dict)
async def get_business_bookings_count(
    business_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get booking statistics for a business"""
    # Verify ownership
    is_owner = await order_service.verify_business_ownership(business_id, current_user_id)
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this business's bookings"
        )
    
    count = await order_service.get_business_bookings_count(business_id)
    return count
