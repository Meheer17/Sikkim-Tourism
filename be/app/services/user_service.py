from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status

from app.core.database import get_database
from app.core.security import get_password_hash, verify_password
from app.models.user import UserCreate, UserUpdate, UserInDB, User


class UserService:
    """Service for user operations"""
    
    def __init__(self):
        pass
    
    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        user = await collection.find_one({"email": email})
        if user:
            return UserInDB(**user)
        return None
    
    async def get_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        if not ObjectId.is_valid(user_id):
            return None
        
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return UserInDB(**user)
        return None
    
    async def create(self, user_create: UserCreate) -> User:
        """Create a new user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        # Check if user exists
        existing_user = await self.get_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user_dict = user_create.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await collection.insert_one(user_dict)
        created_user = await self.get_by_id(str(result.inserted_id))
        
        return User(
            id=str(created_user.id),
            name=created_user.name,
            address=created_user.address,
            gender=created_user.gender,
            email=created_user.email,
            role=created_user.role,
            approved=created_user.approved,
            last_synced_at=created_user.last_synced_at,
            created_at=created_user.created_at,
            updated_at=created_user.updated_at
        )
    
    async def update(self, user_id: str, user_update: UserUpdate) -> User:
        """Update user"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        user = await self.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_update.model_dump(exclude_unset=True)
        
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        update_data["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        updated_user = await self.get_by_id(user_id)
        
        return User(
            id=str(updated_user.id),
            name=updated_user.name,
            address=updated_user.address,
            gender=updated_user.gender,
            email=updated_user.email,
            role=updated_user.role,
            approved=updated_user.approved,
            last_synced_at=updated_user.last_synced_at,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
    
    async def update_secret(self, user_id: str, token: str, expiry: datetime) -> bool:
        """Update user's secret token for password reset"""
        db = get_database()
        if db is None:
            return False
        collection = db.users
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "secret": {"token": token, "expiry": expiry},
                "updated_at": datetime.utcnow()
            }}
        )
        return result.modified_count > 0
    
    async def authenticate(self, email: str, password: str) -> Optional[UserInDB]:
        """Authenticate user"""
        user = await self.get_by_email(email)
        if not user or not user.hashed_password:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    async def delete(self, user_id: str) -> bool:
        """Delete user"""
        db = get_database()
        if db is None:
            return False
        collection = db.users
        if not ObjectId.is_valid(user_id):
            return False
        
        result = await collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0


user_service = UserService()
