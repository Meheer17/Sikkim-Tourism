from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, profile, location, business, event, community, message, compression, upload, friends, cdn, admin, ai_planner


api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(compression.router, prefix="/compress", tags=["Compression"])  
api_router.include_router(location.router, prefix="/location", tags=["Location"])
api_router.include_router(business.router, prefix="/business", tags=["business"])
api_router.include_router(event.router, prefix="/event", tags=["event"])
api_router.include_router(community.router, prefix="/communities", tags=["Communities"])
api_router.include_router(message.router, prefix="/message", tags=["Message"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(friends.router, prefix="/friends", tags=["Friends"])
api_router.include_router(cdn.router, tags=["CDN"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(ai_planner.router, prefix="/ai-planner", tags=["AI Planner"])

# Optional: enable these when ready
# api_router.include_router(files.router, prefix="/files", tags=["Files"])
