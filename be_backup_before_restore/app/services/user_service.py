from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.core.security import get_password_hash, verify_password
from app.models.user import UserCreate, UserUpdate, UserInDB, User

class UserService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.users

    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        user = await self.collection.find_one({"email": email})
        if user:
            return UserInDB(**user)
        return None

    async def get_by_id(self, user_id: str) -> Optional[UserInDB]:
        if not ObjectId.is_valid(user_id):
            return None
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserInDB(**user)
        return None

    async def create(self, user_create: UserCreate) -> User:
        existing_user = await self.get_by_email(user_create.email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user_dict = user_create.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        result = await self.collection.insert_one(user_dict)
        created_user = await self.get_by_id(str(result.inserted_id))
        return User(
            id=str(created_user.id),
            email=created_user.email,
            full_name=created_user.full_name,
            is_active=created_user.is_active,
            created_at=created_user.created_at,
            updated_at=created_user.updated_at
        )

    async def update(self, user_id: str, user_update: UserUpdate) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        update_data = user_update.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        update_data["updated_at"] = datetime.utcnow()
        await self.collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        updated_user = await self.get_by_id(user_id)
        return User(
            id=str(updated_user.id),
            email=updated_user.email,
            full_name=updated_user.full_name,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )

    async def authenticate(self, email: str, password: str) -> Optional[UserInDB]:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    async def delete(self, user_id: str) -> bool:
        if not ObjectId.is_valid(user_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0


user_service = UserService()
