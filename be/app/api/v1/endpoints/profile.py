from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.services.user_service import user_service
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=User)
async def get_my_profile(current_user_id: str = Depends(get_current_user_id)):
    """Get authenticated user's profile"""
    user_db = await user_service.get_by_id(current_user_id)
    
    if not user_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        id=str(user_db.id),
        name=user_db.name,
        address=user_db.address,
        gender=user_db.gender,
        email=user_db.email,
        role=user_db.role,
        approved=user_db.approved,
        last_synced_at=user_db.last_synced_at,
        created_at=user_db.created_at,
        updated_at=user_db.updated_at
    )


@router.get("/{uid}", response_model=User)
async def get_user_profile(
    uid: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get user's profile by id"""
    user_db = await user_service.get_by_id(uid)
    
    if not user_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        id=str(user_db.id),
        name=user_db.name,
        address=user_db.address,
        gender=user_db.gender,
        email=user_db.email,
        role=user_db.role,
        approved=user_db.approved,
        last_synced_at=user_db.last_synced_at,
        created_at=user_db.created_at,
        updated_at=user_db.updated_at
    )
