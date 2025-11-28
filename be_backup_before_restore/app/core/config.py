from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI Production App"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Production-level FastAPI application"
    API_V1_STR: str = "/api/v1"

    ALLOWED_ORIGINS: List[str] = ["*"]

    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Telethon (Telegram client)
    TELEGRAM_API_ID: int
    TELEGRAM_API_HASH: str
    TELEGRAM_CHAT_ID: str
    TELEGRAM_SESSION_NAME: str = "telegram_storage_session"

    PASSWORD_MIN_LENGTH: int = 8

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
