from typing import List
from fastapi import APIRouter, Depends, status, Query, HTTPException

from app.core.security import get_current_user_id
from app.services.comment_service import comment_service
from app.models.comment import CommentCreate, Comment, CommentWithUser

router = APIRouter()


@router.post("/", response_model=CommentWithUser, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a new comment on a service
    
    - **service_id**: ID of the service to comment on
    - **text**: Comment text (max 1000 characters)
    - **rating**: Optional rating from 1 to 5
    """
    comment = await comment_service.create(comment_data, current_user_id)
    return comment


@router.get("/service/{service_id}", response_model=List[CommentWithUser])
async def get_service_comments(
    service_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get all comments for a specific service
    
    Returns comments with user information (name, avatar)
    """
    comments = await comment_service.get_by_service(service_id, skip, limit)
    return comments


@router.get("/user/{user_id}", response_model=List[Comment])
async def get_user_comments(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get all comments by a specific user
    """
    comments = await comment_service.get_by_user(user_id, skip, limit)
    return comments


@router.get("/{comment_id}", response_model=CommentWithUser)
async def get_comment(
    comment_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get a specific comment by ID
    """
    comment_db = await comment_service.get_by_id(comment_id)
    if not comment_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Import here to avoid circular dependency
    from app.services.user_service import user_service
    from app.utils.encryption import decrypt_text
    
    uid_str = str(comment_db.user_id)
    decrypted_text = await decrypt_text(uid_str, comment_db.text)
    
    user = await user_service.get_by_id(uid_str)
    user_name = user.name if user else "Unknown"
    parts = user_name.split()
    user_avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"
    
    return CommentWithUser(
        id=str(comment_db.id),
        user_id=uid_str,
        service_id=str(comment_db.service_id),
        text=decrypted_text,
        rating=comment_db.rating,
        created_at=comment_db.created_at,
        updated_at=comment_db.updated_at,
        user_name=user_name,
        user_avatar=user_avatar,
    )
