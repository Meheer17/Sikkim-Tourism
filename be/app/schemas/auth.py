from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    name: str = Field(..., max_length=255)
    address: str
    gender: Optional[str] = None
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class ForgetPasswordRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str
