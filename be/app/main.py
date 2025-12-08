from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1.router import api_router, websocket_router
from fastapi import Request

from fastapi.staticfiles import StaticFiles
from routes.tts import router as tts_router
from routes.translation import router as translation_router
from routes.translate_tts import router as translate_tts_router

import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, description=settings.DESCRIPTION, lifespan=lifespan)

# Serve mp3 files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.middleware("http")
async def log_incoming_requests(request: Request, call_next):
    try:
        body_bytes = await request.body()
        try:
            body_text = body_bytes.decode('utf-8') if body_bytes else ''
        except Exception:
            body_text = str(body_bytes)

        # Truncate long bodies for brevity
        truncated = (body_text[:1000] + '...') if len(body_text) > 1000 else body_text
        print(f"[HTTP] {request.method} {request.url.path} headers={dict(request.headers)} body={truncated}")
    except Exception as e:
        print(f"[HTTP] Failed to log request: {e}")

    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(tts_router, prefix="/api/v1", tags=["TTS"])
app.include_router(translation_router, prefix="/api/v1", tags=["Translation"])
app.include_router(translate_tts_router, prefix="/api/v1", tags=["Translate-TTS"])

# Include WebSocket routes (needs to be at same level as API for proper WS routing)
app.include_router(websocket_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to the API", "version": settings.VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
