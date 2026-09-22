import sys
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import ENCODERS_BY_TYPE
from bson import ObjectId
from contextlib import asynccontextmanager

# Automatically serialize MongoDB ObjectIds to strings across all FastAPI endpoints
ENCODERS_BY_TYPE[ObjectId] = str

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1.router import api_router, websocket_router

from fastapi.staticfiles import StaticFiles
from routes.tts import router as tts_router
from routes.translation import router as translation_router
from routes.translate_tts import router as translate_tts_router

import json
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, description=settings.DESCRIPTION, lifespan=lifespan)

PIPER_OUT = os.path.join(os.path.dirname(__file__), "..", "piper")
app.mount("/tts/audio", StaticFiles(directory=PIPER_OUT), name="tts_audio")

# Serve mp3 files
app.mount("/static", StaticFiles(directory="static"), name="static")


from fastapi.responses import JSONResponse, Response
import traceback

@app.middleware("http")
async def log_incoming_requests(request: Request, call_next):
    content_type = request.headers.get("content-type", "")
    is_stream_or_multipart = content_type.startswith("multipart/") or content_type.startswith("application/octet-stream")
    if not is_stream_or_multipart:
        try:
            body_bytes = await request.body()
            try:
                body_text = body_bytes.decode('utf-8') if body_bytes else ''
            except Exception:
                body_text = str(body_bytes)
            truncated = (body_text[:500] + '...') if len(body_text) > 500 else body_text
            print(f"[HTTP] {request.method} {request.url.path} body={truncated}")
        except Exception as e:
            print(f"[HTTP] Failed to read body: {e}")
    else:
        print(f"[HTTP] {request.method} {request.url.path} (multipart/stream)")

    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        print(f"[HTTP 500 EXCEPTION] {request.method} {request.url.path}: {exc}")
        traceback.print_exc()
        raise exc

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[GLOBAL UNCAUGHT ERROR] {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": request.url.path}
    )

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


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


