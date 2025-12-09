from fastapi import APIRouter, Depends, status, HTTPException, Query

from app.core.security import get_current_user_id, get_current_government_user
from app.services.user_service import user_service
from app.models.user import User, UserUpdate
from app.schemas.auth import MessageResponse
from app.utils.encryption import decrypt_text
from typing import List

router = APIRouter()


@router.get("", response_model=List[User])
@router.get("/", response_model=List[User], include_in_schema=False)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_government_id: str = Depends(get_current_government_user)
):
    """Get list of all users (Government only, with pagination)"""
    users = await user_service.list(skip=skip, limit=limit)
    return users


@router.get("/me", response_model=User)
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    """Get current user profile"""
    user_db = await user_service.get_by_id(current_user_id)
    
    # Decrypt fields
    decrypted_name = await decrypt_text(current_user_id, user_db.name)
    decrypted_address = await decrypt_text(current_user_id, user_db.address)
    decrypted_email = await decrypt_text(current_user_id, user_db.email)
    
    return User(
        id=str(user_db.id),
        name=decrypted_name,
        address=decrypted_address,
        gender=user_db.gender,
        email=decrypted_email,
        role=user_db.role,
        approved=user_db.approved,
        last_synced_at=user_db.last_synced_at,
        created_at=user_db.created_at,
        updated_at=user_db.updated_at
    )


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    """Update current user profile"""
    updated_user = await user_service.update(current_user_id, user_update)
    return updated_user


@router.delete("/me", response_model=MessageResponse)
async def delete_current_user(current_user_id: str = Depends(get_current_user_id)):
    """Delete current user account"""
    success = await user_service.delete(current_user_id)
    
    if success:
        return MessageResponse(message="User account deleted successfully")
    
    return MessageResponse(message="Failed to delete user account")


@router.put("/{user_id}/approve", response_model=MessageResponse)
async def approve_user(
    user_id: str,
    current_government_id: str = Depends(get_current_government_user)
):
    """Approve a user (Government only)"""
    # Check if user exists
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user's approved status
    update_data = UserUpdate(approved=True)
    await user_service.update(user_id, update_data)
    
    return MessageResponse(message="User approved successfully")


@router.put("/{user_id}/role", response_model=User)
async def update_user_role(
    user_id: str,
    user_update: UserUpdate,
    current_government_id: str = Depends(get_current_government_user)
):
    """Update a user's role (Government only)"""
    # Check if user exists
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only update role
    if user_update.role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is required"
        )
    
    # Update user's role
    updated_user = await user_service.update(user_id, user_update)
    return updated_user
