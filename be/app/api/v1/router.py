from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, files, location, bussiness, community, message, profile, upload

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(location.router, prefix="/location", tags=["Location"])
api_router.include_router(bussiness.router, prefix="/bussiness", tags=["Bussiness"])
api_router.include_router(community.router, prefix="/communities", tags=["Communities"])
api_router.include_router(message.router, prefix="/message", tags=["Message"])
