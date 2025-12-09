from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.services.user_service import user_service
from app.models.user import User
from app.utils.encryption import decrypt_text

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
    
    # Decrypt fields
    decrypted_name = await decrypt_text(uid, user_db.name)
    decrypted_address = await decrypt_text(uid, user_db.address)
    decrypted_email = await decrypt_text(uid, user_db.email)
    
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
