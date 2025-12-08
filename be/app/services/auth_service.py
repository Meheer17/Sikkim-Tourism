from datetime import datetime, timedelta
from fastapi import HTTPException, status
import secrets
from bson import ObjectId

from app.core.security import create_access_token
from app.core.config import settings
from app.core.database import get_database
from app.services.user_service import user_service
from app.models.user import UserCreate, User
from app.schemas.auth import Token, LoginRequest, SignupRequest, ForgetPasswordRequest, MessageResponse


class AuthService:
    """Service for authentication operations"""
    
    async def signup(self, signup_data: SignupRequest) -> Token:
        """Register a new user and return JWT token"""
        user_create = UserCreate(
            name=signup_data.name,
            address=signup_data.address,
            gender=signup_data.gender,
            email=signup_data.email,
            password=signup_data.password
        )
        
        user = await user_service.create(user_create)
        
        # Create access token (3 hours)
        access_token_expires = timedelta(hours=3)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    
    async def signin(self, login_data: LoginRequest) -> Token:
        """Login user and return access token (7 days)"""
        # First check if user exists
        user_exists = await user_service.get_by_email(login_data.email)
        
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not registered. Please sign up first.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await user_service.authenticate(login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is a monastery business owner
        is_monastery = False
        business_id = None
        
        if user.role == "business":
            db = get_database()
            if db is not None:
                # Find user_business connection
                user_business = await db.user_business.find_one({"uid": ObjectId(user.id)})
                
                if user_business:
                    # Get the business details
                    business = await db.business.find_one({"_id": user_business["bid"]})
                    
                    if business:
                        # Check if business type_id is monastery
                        # Monastery type ID: "69367fbfbde0a7ba5f19846f"
                        if business.get("type_id") == "69367fbfbde0a7ba5f19846f":
                            is_monastery = True
                            business_id = str(business["_id"])
        
        # 3 hours expiry
        access_token_expires = timedelta(hours=3)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            is_monastery=is_monastery,
            business_id=business_id
        )
    
    async def forget_password(self, forget_password_data: ForgetPasswordRequest) -> MessageResponse:
        """Request password reset token (expires in 15 minutes)"""
        user = await user_service.get_by_email(forget_password_data.email)
        
        if not user:
            # Don't reveal if email exists or not for security
            return MessageResponse(message="If the email exists, a reset token has been sent")
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(minutes=15)
        
        # Update user with secret token
        await user_service.update_secret(str(user.id), reset_token, expiry)
        
        # In a real application, you would send this token via email
        # For now, we just return success message
        return MessageResponse(message="If the email exists, a reset token has been sent")


auth_service = AuthService()
