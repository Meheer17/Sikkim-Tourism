from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


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
    GEMINI_API_KEY: str = ""
    
    # CDN Configuration
    CDN_URL: str = "https://models.shrishesha.space/api/media/upload"
    CDN_MODEL_URL: str = "https://models.shrishesha.space/api/models/upload"
    CDN_API_KEY: str = "promatrs@25"
    LOCAL_IP: str = "192.168.0.107"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
