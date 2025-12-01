from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.user_relations import (
    UserCommunitiesCreate,
    UserCommunitiesInDB,
    UserCommunities,
    UserCommunitiesRole,
)
from app.services.user_service import user_service
from app.services.community_service import community_service


class UserCommunitiesService:
    """Service to manage user<->community relations (membership, roles)"""

    def __init__(self):
        # Lazy DB resolution
        self.db = None
        self.collection = None

    def _collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database not connected")
        return db.user_communities

    async def add_member(self, uid: str, cid: str, role: UserCommunitiesRole = UserCommunitiesRole.member) -> UserCommunities:
        # validate ids
        if not ObjectId.is_valid(uid) or not ObjectId.is_valid(cid):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid uid or cid")

        # ensure user and community exist
        user = await user_service.get_by_id(uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        community = await community_service.get_by_id(cid)
        if not community:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

        # ensure unique pair
        existing = await self._collection().find_one({"uid": ObjectId(uid), "cid": ObjectId(cid)})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already a member of the community")

        payload = {
            "uid": ObjectId(uid),
            "cid": ObjectId(cid),
            "role": role.value,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await self._collection().insert_one(payload)
        rec = await self._collection().find_one({"_id": result.inserted_id})
        return UserCommunities(**{**rec, "id": str(rec.get("_id"))})

    async def remove_member(self, uid: str, cid: str) -> bool:
        if not ObjectId.is_valid(uid) or not ObjectId.is_valid(cid):
            return False
        result = await self._collection().delete_one({"uid": ObjectId(uid), "cid": ObjectId(cid)})
        return result.deleted_count > 0

    async def is_member(self, uid: str, cid: str) -> bool:
        if not ObjectId.is_valid(uid) or not ObjectId.is_valid(cid):
            return False
        rec = await self._collection().find_one({"uid": ObjectId(uid), "cid": ObjectId(cid)})
        return rec is not None

    async def get_membership(self, uid: str, cid: str) -> Optional[UserCommunitiesInDB]:
        if not ObjectId.is_valid(uid) or not ObjectId.is_valid(cid):
            return None
        rec = await self._collection().find_one({"uid": ObjectId(uid), "cid": ObjectId(cid)})
        if not rec:
            return None
        return UserCommunitiesInDB(**rec)


user_communities_service = UserCommunitiesService()
