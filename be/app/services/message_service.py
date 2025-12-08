from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.message import MessageCreate, MessageInDB, Message, MessageWithUser, MessageStatus
from app.services.user_communities_service import user_communities_service
from app.services.user_service import user_service
from app.services.community_service import community_service
from app.utils.profanity_filter import profanity_filter
from app.utils.encryption import encrypt_text, decrypt_text


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
        include_hidden: bool = False,
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
        
        # By default, only show active messages (not hidden/deleted)
        if not include_hidden:
            query["status"] = {"$in": [MessageStatus.active.value, MessageStatus.flagged.value, None]}

        cursor = self._collection().find(query).sort("created_at", 1).skip(skip).limit(limit)
        messages = []
        async for message in cursor:
            msg_db = MessageInDB(**message)
            # Decrypt message text
            uid_str = str(msg_db.uid)
            decrypted_text = await decrypt_text(uid_str, msg_db.text)
            
            messages.append(
                Message(
                    id=str(msg_db.id),
                    uid=uid_str,
                    cid=str(msg_db.cid),
                    text=decrypted_text,
                    status=msg_db.status,
                    flagged_count=msg_db.flagged_count,
                    created_at=msg_db.created_at,
                )
            )
        return messages

    async def get_all_with_users(
        self,
        skip: int = 0,
        limit: int = 50,
        cid: Optional[str] = None,
        include_hidden: bool = False,
    ) -> List[MessageWithUser]:
        """Get messages with user details for chat display"""
        query = {}
        if cid:
            if not ObjectId.is_valid(cid):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cid")
            query["cid"] = ObjectId(cid)
        
        # By default, only show active messages
        if not include_hidden:
            query["status"] = {"$in": [MessageStatus.active.value, MessageStatus.flagged.value, None]}

        cursor = self._collection().find(query).sort("created_at", 1).skip(skip).limit(limit)
        messages = []
        
        # Cache users to avoid multiple lookups
        user_cache = {}
        
        async for message in cursor:
            msg_db = MessageInDB(**message)
            uid_str = str(msg_db.uid)
            
            # Decrypt message text
            decrypted_text = await decrypt_text(uid_str, msg_db.text)
            
            # Get user info from cache or fetch
            if uid_str not in user_cache:
                user = await user_service.get_by_id(uid_str)
                if user:
                    name = user.name
                    # Generate avatar initials from name
                    parts = name.split()
                    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"
                    user_cache[uid_str] = {"name": name, "avatar": avatar}
                else:
                    user_cache[uid_str] = {"name": "Unknown", "avatar": "?"}
            
            user_info = user_cache[uid_str]
            
            messages.append(
                MessageWithUser(
                    id=str(msg_db.id),
                    uid=uid_str,
                    cid=str(msg_db.cid),
                    text=decrypted_text,
                    status=msg_db.status,
                    flagged_count=msg_db.flagged_count,
                    created_at=msg_db.created_at,
                    user_name=user_info["name"],
                    user_avatar=user_info["avatar"],
                )
            )
        return messages

    async def get_online_count(self, cid: str) -> int:
        """Get approximate online count based on recent activity (last 5 minutes)"""
        if not ObjectId.is_valid(cid):
            return 0
        five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
        # Count unique users who sent messages in last 5 minutes
        pipeline = [
            {"$match": {"cid": ObjectId(cid), "created_at": {"$gte": five_mins_ago}}},
            {"$group": {"_id": "$uid"}},
            {"$count": "online"}
        ]
        result = await self._collection().aggregate(pipeline).to_list(length=1)
        return result[0]["online"] if result else 0

    async def create(self, message_create: MessageCreate, current_user_id: str) -> MessageWithUser:
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

        # Auto-join the community if not a member
        is_member = await user_communities_service.is_member(current_user_id, message_create.cid)
        if not is_member:
            from app.models.user_relations import UserCommunitiesRole
            try:
                await user_communities_service.add_member(current_user_id, message_create.cid, role=UserCommunitiesRole.member)
            except Exception as e:
                print(f"Auto-join failed: {e}")  # Log but continue

        # Validate text
        text = message_create.text or ""
        if not text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text cannot be empty or whitespace")
        if len(text) > 1000:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text too long (max 1000)")
        
        # Check for profanity
        has_profanity, found_words = profanity_filter.contains_profanity(text)
        if has_profanity:
            violation_msg = profanity_filter.get_violation_message(found_words)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=violation_msg
            )

        # Anti-spam: prevent sending messages too frequently (3 seconds window)
        last_msg = await self._collection().find_one({"uid": ObjectId(current_user_id), "cid": ObjectId(message_create.cid)}, sort=[("created_at", -1)])
        if last_msg and "created_at" in last_msg:
            last_ts = last_msg["created_at"]
            if isinstance(last_ts, datetime):
                if datetime.utcnow() - last_ts < timedelta(seconds=3):
                    raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="You're sending messages too quickly")

        # Encrypt message text
        encrypted_text = await encrypt_text(current_user_id, text)
        
        # Build and insert
        message_dict = {
            "uid": ObjectId(current_user_id),
            "cid": ObjectId(message_create.cid),
            "text": encrypted_text,
            "status": MessageStatus.active.value,
            "flagged_by": [],
            "flagged_count": 0,
            "created_at": datetime.utcnow(),
        }

        result = await self._collection().insert_one(message_dict)
        created = await self.get_by_id(str(result.inserted_id))
        
        # Decrypt message text for response
        decrypted_text = await decrypt_text(current_user_id, created.text)
        
        # Get user info for response
        name = user.name
        parts = name.split()
        avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"
        
        return MessageWithUser(
            id=str(created.id),
            uid=str(created.uid),
            cid=str(created.cid),
            text=decrypted_text,
            status=created.status,
            flagged_count=created.flagged_count,
            created_at=created.created_at,
            user_name=name,
            user_avatar=avatar,
        )

    async def flag_message(self, message_id: str, user_id: str) -> Message:
        """Flag a message for admin review"""
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message id")
        
        msg = await self.get_by_id(message_id)
        if not msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        
        # Check if user already flagged
        flagged_by = msg.flagged_by if hasattr(msg, 'flagged_by') and msg.flagged_by else []
        if user_id in [str(uid) for uid in flagged_by]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already flagged this message")
        
        # Update flag status
        await self._collection().update_one(
            {"_id": ObjectId(message_id)},
            {
                "$push": {"flagged_by": ObjectId(user_id)},
                "$inc": {"flagged_count": 1},
                "$set": {"status": MessageStatus.flagged.value}
            }
        )
        
        updated = await self.get_by_id(message_id)
        return Message(
            id=str(updated.id),
            uid=str(updated.uid),
            cid=str(updated.cid),
            text=updated.text,
            status=updated.status,
            flagged_count=updated.flagged_count,
            created_at=updated.created_at,
        )

    async def moderate_message(self, message_id: str, admin_id: str, action: str) -> Message:
        """Admin moderation: hide, restore, or delete a message"""
        if not ObjectId.is_valid(message_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message id")
        
        msg = await self.get_by_id(message_id)
        if not msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        
        if action == "hide":
            new_status = MessageStatus.hidden.value
        elif action == "restore":
            new_status = MessageStatus.active.value
        elif action == "delete":
            new_status = MessageStatus.deleted.value
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action. Use: hide, restore, delete")
        
        await self._collection().update_one(
            {"_id": ObjectId(message_id)},
            {
                "$set": {
                    "status": new_status,
                    "moderated_by": ObjectId(admin_id),
                    "moderated_at": datetime.utcnow(),
                }
            }
        )
        
        updated = await self.get_by_id(message_id)
        # Decrypt text for response
        decrypted_text = await decrypt_text(str(updated.uid), updated.text)
        
        return Message(
            id=str(updated.id),
            uid=str(updated.uid),
            cid=str(updated.cid),
            text=decrypted_text,
            status=updated.status,
            flagged_count=updated.flagged_count,
            created_at=updated.created_at,
        )

    async def get_flagged_messages(self, skip: int = 0, limit: int = 50) -> List[MessageWithUser]:
        """Get all flagged messages for admin review"""
        query = {"status": MessageStatus.flagged.value}
        cursor = self._collection().find(query).sort("flagged_count", -1).skip(skip).limit(limit)
        
        messages = []
        user_cache = {}
        
        async for message in cursor:
            msg_db = MessageInDB(**message)
            uid_str = str(msg_db.uid)
            
            # Decrypt message text
            decrypted_text = await decrypt_text(uid_str, msg_db.text)
            
            if uid_str not in user_cache:
                user = await user_service.get_by_id(uid_str)
                if user:
                    name = user.name
                    parts = name.split()
                    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"
                    user_cache[uid_str] = {"name": name, "avatar": avatar}
                else:
                    user_cache[uid_str] = {"name": "Unknown", "avatar": "?"}
            
            user_info = user_cache[uid_str]
            
            messages.append(
                MessageWithUser(
                    id=str(msg_db.id),
                    uid=uid_str,
                    cid=str(msg_db.cid),
                    text=decrypted_text,
                    status=msg_db.status,
                    flagged_count=msg_db.flagged_count,
                    created_at=msg_db.created_at,
                    user_name=user_info["name"],
                    user_avatar=user_info["avatar"],
                )
            )
        return messages

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

        # Encrypt new text
        encrypted_new_text = await encrypt_text(str(msg.uid), new_text)
        
        await self._collection().update_one({"_id": ObjectId(message_id)}, {"$set": {"text": encrypted_new_text}})
        updated = await self.get_by_id(message_id)
        
        # Decrypt for response
        decrypted_text = await decrypt_text(str(updated.uid), updated.text)
        
        return Message(
            id=str(updated.id),
            uid=str(updated.uid),
            cid=str(updated.cid),
            text=decrypted_text,
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
