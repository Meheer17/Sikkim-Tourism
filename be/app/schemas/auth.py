from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_monastery: Optional[bool] = False
    business_id: Optional[str] = None


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


class Position(BaseModel):
    """Location coordinates"""
    x: float  # longitude
    y: float  # latitude


class MonasteryRegistrationRequest(BaseModel):
    """Monastery registration request"""
    # User information
    name: str = Field(..., max_length=255, description="Monastery name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password for the account")
    address: str = Field(..., description="Physical address")
    
    # Monastery/Location information
    description: str = Field(..., description="Detailed description of the monastery")
    short_description: str = Field(..., max_length=255, description="Short description")
    position: dict = Field(..., description="Location coordinates (x: longitude, y: latitude)")
    
    # Business information
    open_hours_start: str = Field(..., description="Opening time in HH:MM format (24-hour)")
    open_hours_end: str = Field(..., description="Closing time in HH:MM format (24-hour)")
    scheduled_at: str = Field(..., description="ISO 8601 datetime for scheduling")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v