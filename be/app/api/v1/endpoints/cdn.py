from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse, RedirectResponse
import httpx
from typing import Literal

router = APIRouter()

CDN_BASE_URL = "https://models.shrishesha.space"

@router.get("/cdn/models")
async def list_models():
    """List all 3D models from CDN"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{CDN_BASE_URL}/api/models")
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="CDN request timed out"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch models from CDN: {str(e)}"
        )


@router.get("/cdn/models/{filename}")
async def get_model(filename: str):
    """Get a specific 3D model file from CDN"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(f"{CDN_BASE_URL}/api/models/{filename}")
            response.raise_for_status()
            return StreamingResponse(
                response.iter_bytes(),
                media_type=response.headers.get("content-type", "model/gltf-binary"),
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Content-Length": response.headers.get("content-length", "0")
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"CDN request timed out for model: {filename}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if e.response.status_code == 404 else status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch model from CDN: {str(e)}"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CDN connection error: {str(e)}"
        )


@router.get("/cdn/media")
async def list_media(type: Literal["images", "videos"] = None):
    """List all media (images/videos) from CDN"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{CDN_BASE_URL}/api/media"
            if type:
                url += f"?type={type}"
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="CDN request timed out"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch media from CDN: {str(e)}"
        )


@router.get("/cdn/images/{filename}")
async def get_image(filename: str):
    """Get a specific image from CDN"""
    try:
        # Increase timeout to 60 seconds for large images
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(f"{CDN_BASE_URL}/images/{filename}")
            response.raise_for_status()
            return StreamingResponse(
                response.iter_bytes(),
                media_type=response.headers.get("content-type", "image/jpeg"),
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Content-Length": response.headers.get("content-length", "0"),
                    "Cache-Control": "public, max-age=31536000"
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"CDN request timed out for image: {filename}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if e.response.status_code == 404 else status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch image from CDN: {str(e)}"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CDN connection error: {str(e)}"
        )


@router.get("/cdn/videos/{filename}")
async def get_video(filename: str):
    """Get a specific video from CDN"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CDN_BASE_URL}/videos/{filename}")
            response.raise_for_status()
            return StreamingResponse(
                response.iter_bytes(),
                media_type=response.headers.get("content-type", "video/mp4"),
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Content-Length": response.headers.get("content-length", "0"),
                    "Cache-Control": "public, max-age=31536000",
                    "Accept-Ranges": "bytes"
                }
            )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if e.response.status_code == 404 else status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch video from CDN: {str(e)}"
        )


@router.get("/cdn/viewer/models/{filename}")
async def get_model_viewer_url(filename: str):
    """Get the viewer URL for a 3D model"""
    return {
        "filename": filename,
        "viewer_url": f"{CDN_BASE_URL}/models/viewer/{filename}",
        "view_url": f"{CDN_BASE_URL}/models/view/{filename}",
        "direct_url": f"{CDN_BASE_URL}/api/models/{filename}"
    }


@router.get("/cdn/viewer/images/{filename}")
async def get_image_viewer_url(filename: str):
    """Get the viewer URL for an image"""
    return {
        "filename": filename,
        "viewer_url": f"{CDN_BASE_URL}/media/viewer/{filename}",
        "view_url": f"{CDN_BASE_URL}/media/view/{filename}",
        "direct_url": f"{CDN_BASE_URL}/images/{filename}"
    }


@router.get("/cdn/viewer/videos/{filename}")
async def get_video_viewer_url(filename: str):
    """Get the viewer URL for a video"""
    return {
        "filename": filename,
        "viewer_url": f"{CDN_BASE_URL}/media/viewer/{filename}",
        "view_url": f"{CDN_BASE_URL}/media/view/{filename}",
        "direct_url": f"{CDN_BASE_URL}/videos/{filename}"
    }
