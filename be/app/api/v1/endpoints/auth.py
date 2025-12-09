from fastapi import APIRouter, status

from app.schemas.auth import Token, LoginRequest, SignupRequest, ForgetPasswordRequest, MessageResponse, RefreshTokenRequest
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: SignupRequest):
    """Create user; returns JWT (7 days)"""
    token = await auth_service.signup(signup_data)
    return token


@router.post("/signin", response_model=Token)
async def signin(login_data: LoginRequest):
    """Sign in; returns JWT (7 days)"""
    token = await auth_service.signin(login_data)
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_data: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    token = await auth_service.refresh_access_token(refresh_data.refresh_token)
    return token


@router.post("/forgetpassword", response_model=MessageResponse)
async def forget_password(forget_password_data: ForgetPasswordRequest):
    """Request password/reset token (token expires 15 minutes)"""
    result = await auth_service.forget_password(forget_password_data)
    return result
