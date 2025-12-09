from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache
import os
from pathlib import Path

# Load from root .env file
ROOT_DIR = Path(__file__).resolve().parents[3]   # points to project root (one level up from /be)
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "FastAPI Production App"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Production-level FastAPI application"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Security
    PASSWORD_MIN_LENGTH: int = 8
    
    # Gemini API
    GEMINI_API_KEY: str
    
    # CDN Configuration (for uploading media files and 3D models)
    CDN_URL: str = ""
    CDN_MODEL_URL: str = ""
    CDN_API_KEY: str = ""
    LOCAL_IP: str = "127.0.0.1"
    
    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env (for frontend variables)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
