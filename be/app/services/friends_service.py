from datetime import datetime
import random
from typing import List, Optional, Tuple
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.utils.encryption import encrypt_text, decrypt_text


class FriendsService:
    async def _generate_unique_code(self) -> str:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        # Try up to N times to avoid rare collisions
        for _ in range(20):
            code = f"{random.randint(1000, 9999)}"
            exists = await db.groups.find_one({"code": code})
            if not exists:
                return code
        raise HTTPException(status_code=500, detail="Failed to generate unique group code")

    async def create_group(self, owner_user_id: str) -> Tuple[str, str]:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        # Check if user already owns a group
        uid = ObjectId(owner_user_id) if ObjectId.is_valid(owner_user_id) else owner_user_id
        existing = await db.groups.find_one({"owner_id": uid})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have an active group. Disband it first to create a new one.")

        code = await self._generate_unique_code()
        doc = {
            "owner_id": ObjectId(owner_user_id) if ObjectId.is_valid(owner_user_id) else owner_user_id,
            "code": code,
            "members": [ObjectId(owner_user_id) if ObjectId.is_valid(owner_user_id) else owner_user_id],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        res = await db.groups.insert_one(doc)
        return (str(res.inserted_id), code)

    async def get_group_by_code(self, code: str) -> Optional[dict]:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        return await db.groups.find_one({"code": code})

    async def join_group(self, user_id: str, code: str) -> Tuple[str, str]:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        group = await self.get_group_by_code(code)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        members = group.get("members", [])
        if uid not in members and not any(str(m) == str(uid) for m in members):
            await db.groups.update_one({"_id": group["_id"]}, {"$addToSet": {"members": uid}, "$set": {"updated_at": datetime.utcnow()}})

        return (str(group["_id"]), group["code"])

    async def upsert_location(self, group_id: str, user_id: str, lat: float, lng: float) -> bool:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        # Encrypt location coordinates
        encrypted_lat = await encrypt_text(user_id, str(lat))
        encrypted_lng = await encrypt_text(user_id, str(lng))
        
        await db.group_locations.update_one(
            {"group_id": gid, "user_id": uid},
            {
                "$set": {
                    "lat": encrypted_lat,
                    "lng": encrypted_lng,
                    "last_seen_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )
        return True

    async def list_member_locations(self, group_id: str) -> List[dict]:
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id

        # Fetch group to know members
        group = await db.groups.find_one({"_id": gid})
        if not group:
            # Group was disbanded, return empty list
            return []

        # Fetch locations
        cursor = db.group_locations.find({"group_id": gid})
        locations = {str(doc.get("user_id")): doc async for doc in cursor}

        # Fetch member names (best-effort)
        member_ids = group.get("members", [])
        # Normalize to string ids
        member_ids_str = [str(mid) for mid in member_ids]
        users_cursor = db.users.find({"_id": {"$in": [ObjectId(mid) for mid in member_ids_str if ObjectId.is_valid(mid)]}})
        users_map = {}
        async for u in users_cursor:
            users_map[str(u.get("_id"))] = u

        members: List[dict] = []
        for mid in member_ids_str:
            u = users_map.get(mid)
            name = None
            initials = None
            
            if u:
                name = u.get("name")
                if name:
                    parts = name.split()
                    initials = "".join(p[0].upper() for p in parts[:2] if p)

            loc = locations.get(mid, {})
            # Decrypt location coordinates
            encrypted_lat = loc.get("lat")
            encrypted_lng = loc.get("lng")
            decrypted_lat = None
            decrypted_lng = None
            if encrypted_lat:
                try:
                    decrypted_lat_str = await decrypt_text(mid, str(encrypted_lat))
                    decrypted_lat = float(decrypted_lat_str) if decrypted_lat_str else None
                except:
                    pass
            if encrypted_lng:
                try:
                    decrypted_lng_str = await decrypt_text(mid, str(encrypted_lng))
                    decrypted_lng = float(decrypted_lng_str) if decrypted_lng_str else None
                except:
                    pass
            
            members.append({
                "user_id": mid,
                "name": name,
                "initials": initials,
                "lat": decrypted_lat,
                "lng": decrypted_lng,
                "last_seen_at": loc.get("last_seen_at"),
            })

        return members

    async def get_group_info(self, group_id: str) -> dict:
        """Get group information including owner_id"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        group = await db.groups.find_one({"_id": gid})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        # Handle created_at field - convert to string if it exists
        created_at = group.get("created_at")
        if created_at:
            created_at = str(created_at) if not isinstance(created_at, str) else created_at
        else:
            created_at = ""

        return {
            "group_id": str(group["_id"]),
            "code": group.get("code", ""),
            "owner_id": str(group.get("owner_id", "")),
            "member_count": len(group.get("members", [])),
            "created_at": created_at,
        }

    async def validate_group_exists(self, group_id: str) -> bool:
        """Check if a group still exists"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        group = await db.groups.find_one({"_id": gid})
        return group is not None

    async def disband_group(self, group_id: str, user_id: str) -> bool:
        """Disband a group - only owner can do this"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        # Check if group exists and user is owner
        group = await db.groups.find_one({"_id": gid})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        if str(group["owner_id"]) != str(uid):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group owner can disband the group")

        # Delete all location records for this group
        await db.group_locations.delete_many({"group_id": gid})

        # Delete the group
        result = await db.groups.delete_one({"_id": gid})
        return result.deleted_count > 0

    async def leave_group(self, group_id: str, user_id: str) -> bool:
        """Leave a group - removes user from members list"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")

        gid = ObjectId(group_id) if ObjectId.is_valid(group_id) else group_id
        uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

        # Check if group exists
        group = await db.groups.find_one({"_id": gid})
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        # Owner cannot leave, they must disband
        if str(group["owner_id"]) == str(uid):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group owner cannot leave. Disband the group instead.")

        # Remove user from members list
        await db.groups.update_one(
            {"_id": gid},
            {"$pull": {"members": uid}}
        )

        # Delete user's location record for this group
        await db.group_locations.delete_one({"group_id": gid, "user_id": uid})

        return True


friends_service = FriendsService()
