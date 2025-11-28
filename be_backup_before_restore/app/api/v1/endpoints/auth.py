from fastapi import APIRouter, status
from app.schemas.auth import Token, LoginRequest, RegisterRequest
from app.services.auth_service import auth_service
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(register_data: RegisterRequest):
    user = await auth_service.register(register_data)
    return user

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    token = await auth_service.login(login_data)
    return token
