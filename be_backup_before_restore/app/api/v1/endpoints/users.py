from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.services.user_service import user_service
from app.models.user import User, UserUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    user_db = await user_service.get_by_id(current_user_id)
    return User(id=str(user_db.id), email=user_db.email, full_name=user_db.full_name, is_active=user_db.is_active, created_at=user_db.created_at, updated_at=user_db.updated_at)

@router.put("/me", response_model=User)
async def update_current_user(user_update: UserUpdate, current_user_id: str = Depends(get_current_user_id)):
    updated_user = await user_service.update(current_user_id, user_update)
    return updated_user

@router.delete("/me", response_model=MessageResponse)
async def delete_current_user(current_user_id: str = Depends(get_current_user_id)):
    success = await user_service.delete(current_user_id)
    if success:
        return MessageResponse(message="User account deleted successfully")
    return MessageResponse(message="Failed to delete user account")
