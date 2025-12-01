from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.message import MessageCreate, MessageInDB, Message
from app.services.user_communities_service import user_communities_service
from app.services.user_service import user_service
from app.services.community_service import community_service


class MessageService:
    """Service for message operations with membership and anti-spam checks"""

    def __init__(self):
        # Lazy DB resolution
        self.db = None
        self.collection = None

    def _collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database not connected")
        return db.messages

    async def get_by_id(self, message_id: str) -> Optional[MessageInDB]:
        if not ObjectId.is_valid(message_id):
            return None
        message = await self._collection().find_one({"_id": ObjectId(message_id)})
        if message:
            return MessageInDB(**message)
        return None

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        uid: Optional[str] = None,
        cid: Optional[str] = None,
        q: Optional[str] = None,
    ) -> List[Message]:
        query = {}
        if uid:
            if not ObjectId.is_valid(uid):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid uid")
            query["uid"] = ObjectId(uid)
        if cid:
            if not ObjectId.is_valid(cid):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cid")
            query["cid"] = ObjectId(cid)
        # Full-text-ish search on message text (case-insensitive substring)
        if q:
            # sanitize q: if empty after strip, ignore
            q_str = q.strip()
            if q_str:
                query["text"] = {"$regex": q_str, "$options": "i"}

        cursor = self._collection().find(query).skip(skip).limit(limit)
        messages = []
        async for message in cursor:
            msg_db = MessageInDB(**message)
            messages.append(
                Message(
                    id=str(msg_db.id),
                    uid=str(msg_db.uid),
                    cid=str(msg_db.cid),
                    text=msg_db.text,
                    created_at=msg_db.created_at,
                )
            )
        return messages

    async def create(self, message_create: MessageCreate, current_user_id: str) -> Message:
        # Validate input IDs
        if not ObjectId.is_valid(message_create.cid):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid community id")
        if not ObjectId.is_valid(current_user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

        # Ensure user exists and is member of the community
        user = await user_service.get_by_id(current_user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        community = await community_service.get_by_id(message_create.cid)
        if not community:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

        is_member = await user_communities_service.is_member(current_user_id, message_create.cid)
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the community")

        # Validate text
        text = message_create.text or ""
        if not text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty or whitespace")
        if len(text) > 1000:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text too long (max 1000)")

        # Anti-spam: prevent sending messages too frequently (5 seconds window)
        last_msg = await self._collection().find_one({"uid": ObjectId(current_user_id), "cid": ObjectId(message_create.cid)}, sort=[("created_at", -1)])
        if last_msg and "created_at" in last_msg:
            last_ts = last_msg["created_at"]
            if isinstance(last_ts, datetime):
                if datetime.utcnow() - last_ts < timedelta(seconds=5):
                    raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="You're sending messages too quickly")

        # Build and insert
        message_dict = {
            "uid": ObjectId(current_user_id),
            "cid": ObjectId(message_create.cid),
            "text": text,
            "created_at": datetime.utcnow(),
        }

        result = await self._collection().insert_one(message_dict)
        created = await self.get_by_id(str(result.inserted_id))
        return Message(
            id=str(created.id),
            uid=str(created.uid),
            cid=str(created.cid),
            text=created.text,
            created_at=created.created_at,
        )

    async def update(self, message_id: str, new_text: str, actor_user_id: str) -> Message:
        # validate
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message id")
        msg = await self.get_by_id(message_id)
        if not msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        # actor must be message owner or community owner
        is_owner = False
        membership = await user_communities_service.get_membership(actor_user_id, str(msg.cid))
        if membership and membership.role == "owner":
            is_owner = True

        if str(msg.uid) != actor_user_id and not is_owner:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update message")

        if not new_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty or whitespace")
        if len(new_text) > 1000:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text too long (max 1000)")

        await self._collection().update_one({"_id": ObjectId(message_id)}, {"$set": {"text": new_text}})
        updated = await self.get_by_id(message_id)
        return Message(
            id=str(updated.id),
            uid=str(updated.uid),
            cid=str(updated.cid),
            text=updated.text,
            created_at=updated.created_at,
        )

    async def delete(self, message_id: str, actor_user_id: str) -> bool:
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message id")
        msg = await self.get_by_id(message_id)
        if not msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        is_owner = False
        membership = await user_communities_service.get_membership(actor_user_id, str(msg.cid))
        if membership and membership.role == "owner":
            is_owner = True

        if str(msg.uid) != actor_user_id and not is_owner:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete message")

        result = await self._collection().delete_one({"_id": ObjectId(message_id)})
        return result.deleted_count > 0


message_service = MessageService()
