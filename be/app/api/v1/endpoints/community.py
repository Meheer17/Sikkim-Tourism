from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, HTTPException
from bson import ObjectId

from app.core.security import get_current_user_id
from app.services.community_service import community_service
from app.services.user_communities_service import user_communities_service, user_communities_service as _uc_service
from app.models.user_relations import UserCommunitiesRole
from app.models.community import Community, CommunityCreate, CommunityUpdate
from app.schemas.auth import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[Community])
async def list_communities(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    q: Optional[str] = Query(None, description="Search communities by name or description"),
    current_user_id: str = Depends(get_current_user_id),
):
    """List communities"""
    communities = await community_service.get_all(skip, limit, q)
    return communities


@router.post("/", response_model=Community, status_code=status.HTTP_201_CREATED)
async def create_community(
    community_data: CommunityCreate,
    current_user_id: str = Depends(get_current_user_id),
):
    """Create community and add current user as owner"""
    community = await community_service.create(community_data)
    # add membership as owner
    try:
        await user_communities_service.add_member(current_user_id, community.id, role=UserCommunitiesRole.owner)
    except Exception:
        # ignore membership creation errors here
        pass
    return community


@router.get("/{id}", response_model=Community)
async def get_community(id: str, current_user_id: str = Depends(get_current_user_id)):
    """Get community by id"""
    community = await community_service.get_by_id(id)
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return Community(
        id=str(community.id),
        name=community.name,
        decription=community.decription,
        created_at=community.created_at,
        updated_at=community.updated_at,
    )


@router.put("/{id}", response_model=Community)
async def update_community(id: str, community_update: CommunityUpdate, current_user_id: str = Depends(get_current_user_id)):
    """Update community (only owner can update)"""
    membership = await user_communities_service.get_membership(current_user_id, id)
    if not membership or membership.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update community")

    community = await community_service.update(id, community_update)
    return community


@router.delete("/{id}", response_model=MessageResponse)
async def delete_community(id: str, current_user_id: str = Depends(get_current_user_id)):
    """Delete community (only owner)"""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid community id")

    membership = await user_communities_service.get_membership(current_user_id, id)
    if not membership or membership.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete community")

    success = await community_service.delete(id)
    if success:
        return MessageResponse(message="Community deleted successfully")
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
