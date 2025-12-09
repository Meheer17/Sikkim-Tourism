from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    return password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default token expiry: 3 hours
        expire = datetime.utcnow() + timedelta(hours=3)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        # Enforce strict validation: raise 401 on any decode error (including expiry)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    print(f"[DEBUG] Decoded token payload: {payload}")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Debug logging
    print(f"[DEBUG] Authenticated user_id: {user_id}")
    
    return user_id


async def get_current_user_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """Optional authentication - returns None if no credentials provided"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id:
            print(f"[DEBUG] Authenticated user_id (optional): {user_id}")
            return user_id
    except Exception as e:
        print(f"[DEBUG] Optional auth failed: {str(e)}")
    
    return None


async def get_current_government_user(
    current_user_id: str = Depends(get_current_user_id)
) -> str:
    """Check if current user is government and return user_id"""
    from app.services.user_service import user_service
    
    user = await user_service.get_by_id(current_user_id)
    # Debug: print role for troubleshooting
    try:
        print(f"[DEBUG] Government check for user_id={current_user_id}, role={getattr(user, 'role', None)}")
    except Exception:
        pass

    role = (getattr(user, "role", None) or "").strip().lower()
    if not user or role != "government":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Government access required"
        )
    return current_user_id


async def get_current_approved_user_id(
    current_user_id: str = Depends(get_current_user_id)
) -> str:
    """Check if current user is approved and return user_id"""
    from app.services.user_service import user_service
    
    user = await user_service.get_by_id(current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for a government official to approve your account."
        )
    
    return current_user_id