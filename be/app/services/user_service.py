from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
import secrets

from app.core.database import get_database
from app.core.security import get_password_hash, verify_password
from app.models.user import UserCreate, UserUpdate, UserInDB, User
from app.utils.encryption import encrypt_text, decrypt_text
from pydantic import ValidationError

from app.utils.encryption import decrypt_text


class UserService:
    """Service for user operations"""
    
    def __init__(self):
        pass
    
    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email (searches encrypted emails)"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        user = await collection.find_one({"email": email})
        if user:
            try:
                return UserInDB(**user)
            except ValidationError as ve:
                # Log and return None so callers can handle missing/invalid user data
                # This prevents a malformed user record (e.g., email contains token) from causing a 500 error
                print(f"[UserService] validation error while parsing user by email {email}: {ve}")
                return None
        return None
    
    async def get_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get user by ID (returns encrypted data as-is)"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        if not ObjectId.is_valid(user_id):
            return None
        
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if user:
            try:
                return UserInDB(**user)
            except ValidationError as ve:
                # Log and return None so callers can handle missing/invalid user data
                print(f"[UserService] validation error while parsing user by id {user_id}: {ve}")
                return None
        return None
    
    async def create(self, user_create: UserCreate) -> User:
        """Create a new user with encrypted fields"""
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
        
        # Generate random USERHASH (64 characters)
        userhash = secrets.token_hex(32)
        
        # Create user
        user_dict = user_create.model_dump()
        hashed_password = get_password_hash(user_dict.pop("password"))
        user_dict["hashed_password"] = hashed_password
        user_dict["userhash"] = userhash
        user_dict["approved"] = False  # Explicitly set approved to false by default
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        # Insert user first to get user_id for encryption
        result = await collection.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # Encrypt fields: name, address, email, hashed_password
        encrypted_name = await encrypt_text(user_id, user_dict["name"])
        encrypted_address = await encrypt_text(user_id, user_dict["address"])
        encrypted_email = await encrypt_text(user_id, user_dict["email"])
        encrypted_password = await encrypt_text(user_id, hashed_password)
        
        # Update user document with encrypted fields
        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "name": encrypted_name,
                "address": encrypted_address,
                "email": encrypted_email,
                "hashed_password": encrypted_password
            }}
        )
        
        created_user = await self.get_by_id(user_id)
        
        # Decrypt fields for response
        decrypted_name = await decrypt_text(user_id, created_user.name)
        decrypted_address = await decrypt_text(user_id, created_user.address)
        decrypted_email = await decrypt_text(user_id, created_user.email)
        
        return User(
            id=str(created_user.id),
            name=decrypted_name,
            address=decrypted_address,
            gender=created_user.gender,
            email=decrypted_email,
            role=created_user.role,
            approved=created_user.approved,
            last_synced_at=created_user.last_synced_at,
            created_at=created_user.created_at,
            updated_at=created_user.updated_at
        )
    
    async def update(self, user_id: str, user_update: UserUpdate) -> User:
        """Update user with encryption for sensitive fields"""
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
        
        # Encrypt sensitive fields if being updated
        if "name" in update_data:
            update_data["name"] = await encrypt_text(user_id, update_data["name"])
        if "address" in update_data:
            update_data["address"] = await encrypt_text(user_id, update_data["address"])
        if "email" in update_data:
            update_data["email"] = await encrypt_text(user_id, update_data["email"])
        if "password" in update_data:
            hashed_pwd = get_password_hash(update_data.pop("password"))
            update_data["hashed_password"] = await encrypt_text(user_id, hashed_pwd)
        
        update_data["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        updated_user = await self.get_by_id(user_id)
        
        # Decrypt fields for response
        decrypted_name = await decrypt_text(user_id, updated_user.name)
        decrypted_address = await decrypt_text(user_id, updated_user.address)
        decrypted_email = await decrypt_text(user_id, updated_user.email)
        
        return User(
            id=str(updated_user.id),
            name=decrypted_name,
            address=decrypted_address,
            gender=updated_user.gender,
            email=decrypted_email,
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
        """Authenticate user (decrypt password for verification)"""
        user = await self.get_by_email(email)
        if not user or not user.hashed_password:
            return None
        
        # Decrypt hashed password before verification
        user_id = str(user.id)
        decrypted_hashed_password = await decrypt_text(user_id, user.hashed_password)
        
        if not verify_password(password, decrypted_hashed_password):
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
    
    async def list(self, skip: int = 0, limit: int = 100) -> List[User]:
        """List all users with pagination (decrypt fields)"""
        db = get_database()
        if db is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database not connected")
        collection = db.users
        
        cursor = collection.find().skip(skip).limit(limit).sort("created_at", -1)
        users = await cursor.to_list(length=limit)
        
        decrypted_users = []
        for user in users:
            user_id = str(user["_id"])
            # Decrypt fields
            decrypted_name = await decrypt_text(user_id, user.get("name", ""))
            decrypted_address = await decrypt_text(user_id, user.get("address", ""))
            decrypted_email = await decrypt_text(user_id, user.get("email", ""))
            
            decrypted_users.append(
                User(
                    id=user_id,
                    name=decrypted_name,
                    address=decrypted_address,
                    gender=user.get("gender"),
                    email=decrypted_email,
                    role=user.get("role", "user"),
                    approved=user.get("approved", False),
                    last_synced_at=user.get("last_synced_at"),
                    created_at=user.get("created_at", datetime.utcnow()),
                    updated_at=user.get("updated_at", datetime.utcnow())
                )
            )
        
        return decrypted_users


user_service = UserService()
