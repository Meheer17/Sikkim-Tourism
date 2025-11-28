from datetime import timedelta
from fastapi import HTTPException, status

from app.core.security import create_access_token
from app.core.config import settings
from app.services.user_service import user_service
from app.models.user import UserCreate, User
from app.schemas.auth import Token, LoginRequest, RegisterRequest

class AuthService:
    async def register(self, register_data: RegisterRequest) -> User:
        user_create = UserCreate(email=register_data.email, password=register_data.password, full_name=register_data.full_name)
        user = await user_service.create(user_create)
        return user

    async def login(self, login_data: LoginRequest) -> Token:
        user = await user_service.authenticate(login_data.email, login_data.password)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
        return Token(access_token=access_token, token_type="bearer")


auth_service = AuthService()
