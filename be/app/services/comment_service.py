from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.comment import CommentCreate, CommentInDB, Comment, CommentWithUser
from app.services.user_service import user_service
from app.utils.encryption import encrypt_text, decrypt_text


class CommentService:
    """Service for comment operations"""

    def __init__(self):
        pass

    def _collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("Database not connected")
        return db.comments

    async def get_by_id(self, comment_id: str) -> Optional[CommentInDB]:
        """Get comment by ID"""
        if not ObjectId.is_valid(comment_id):
            return None
        comment = await self._collection().find_one({"_id": ObjectId(comment_id)})
        if comment:
            return CommentInDB(**comment)
        return None

    async def create(self, comment_create: CommentCreate, user_id: str) -> CommentWithUser:
        """Create a new comment"""
        # Validate service exists
        db = get_database()
        service = await db.services.find_one({"_id": ObjectId(comment_create.service_id)})
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )

        # Encrypt comment text
        encrypted_text = await encrypt_text(user_id, comment_create.text)

        # Build comment document
        comment_dict = {
            "user_id": ObjectId(user_id),
            "service_id": ObjectId(comment_create.service_id),
            "text": encrypted_text,
            "rating": comment_create.rating,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await self._collection().insert_one(comment_dict)
        created = await self.get_by_id(str(result.inserted_id))

        # Decrypt text for response
        decrypted_text = await decrypt_text(user_id, created.text)

        # Get user info
        user = await user_service.get_by_id(user_id)
        user_name = user.name if user else "Unknown"
        parts = user_name.split()
        user_avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"

        return CommentWithUser(
            id=str(created.id),
            user_id=str(created.user_id),
            service_id=str(created.service_id),
            text=decrypted_text,
            rating=created.rating,
            created_at=created.created_at,
            updated_at=created.updated_at,
            user_name=user_name,
            user_avatar=user_avatar,
        )

    async def get_by_service(
        self,
        service_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[CommentWithUser]:
        """Get all comments for a service"""
        if not ObjectId.is_valid(service_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid service_id"
            )

        query = {"service_id": ObjectId(service_id)}
        cursor = self._collection().find(query).sort("created_at", -1).skip(skip).limit(limit)

        comments = []
        user_cache = {}

        async for comment_doc in cursor:
            comment_db = CommentInDB(**comment_doc)
            uid_str = str(comment_db.user_id)

            # Decrypt comment text
            decrypted_text = await decrypt_text(uid_str, comment_db.text)

            # Get user info from cache or fetch
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

            comments.append(
                CommentWithUser(
                    id=str(comment_db.id),
                    user_id=uid_str,
                    service_id=str(comment_db.service_id),
                    text=decrypted_text,
                    rating=comment_db.rating,
                    created_at=comment_db.created_at,
                    updated_at=comment_db.updated_at,
                    user_name=user_info["name"],
                    user_avatar=user_info["avatar"],
                )
            )

        return comments

    async def get_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Comment]:
        """Get all comments by a user"""
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id"
            )

        query = {"user_id": ObjectId(user_id)}
        cursor = self._collection().find(query).sort("created_at", -1).skip(skip).limit(limit)

        comments = []
        async for comment_doc in cursor:
            comment_db = CommentInDB(**comment_doc)
            
            # Decrypt comment text
            decrypted_text = await decrypt_text(user_id, comment_db.text)

            comments.append(
                Comment(
                    id=str(comment_db.id),
                    user_id=user_id,
                    service_id=str(comment_db.service_id),
                    text=decrypted_text,
                    rating=comment_db.rating,
                    created_at=comment_db.created_at,
                    updated_at=comment_db.updated_at,
                )
            )

        return comments


comment_service = CommentService()
