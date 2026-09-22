from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse, RedirectResponse, FileResponse, HTMLResponse
import httpx
import os
from pathlib import Path
from typing import Literal

router = APIRouter()

CDN_BASE_URL = "https://models.shrishesha.space"

@router.get("/cdn/models")
async def list_models():
    """List all 3D models available locally and from CDN"""
    local_models = []
    project_root = Path(__file__).resolve().parents[5]
    be_dir = Path(__file__).resolve().parents[4]
    check_dirs = [project_root / "monastry_models", be_dir / "monastry_models", be_dir / "static" / "models"]
    seen = set()
    for d in check_dirs:
        if d.is_dir():
            for f in d.iterdir():
                if f.is_file() and f.suffix.lower() in [".glb", ".gltf"] and f.name not in seen:
                    seen.add(f.name)
                    local_models.append({
                        "filename": f.name,
                        "name": f.stem,
                        "size": f.stat().st_size,
                        "url": f"/api/v1/cdn/models/{f.name}"
                    })
    return {"models": local_models}


@router.get("/cdn/models/{filename}")
async def get_model(filename: str):
    """Get a specific 3D model file from local storage or fallback to CDN"""
    project_root = Path(__file__).resolve().parents[5]
    be_dir = Path(__file__).resolve().parents[4]
    check_dirs = [
        project_root / "monastry_models",
        be_dir / "monastry_models",
        be_dir / "static" / "models",
    ]

    candidates = [
        filename,
        f"{filename}.glb" if not filename.lower().endswith(('.glb', '.gltf')) else filename,
        f"{filename}.gltf" if not filename.lower().endswith(('.glb', '.gltf')) else filename,
    ]

    for candidate in candidates:
        for check_dir in check_dirs:
            target = check_dir / candidate
            if target.is_file():
                media_type = "model/gltf-binary" if candidate.lower().endswith(".glb") else "model/gltf+json"
                return FileResponse(
                    str(target),
                    media_type=media_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Content-Disposition": f'inline; filename="{candidate}"',
                        "Cache-Control": "public, max-age=86400"
                    }
                )

    # If not found locally, try fetching from CDN
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(f"{CDN_BASE_URL}/api/models/{filename}")
            response.raise_for_status()
            return StreamingResponse(
                response.iter_bytes(),
                media_type=response.headers.get("content-type", "model/gltf-binary"),
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Content-Length": response.headers.get("content-length", "0")
                }
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"3D model '{filename}' not found"
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
    """Get a specific image from CDN or local static fallback"""
    # 1. Check local static directory if image was stored locally
    static_images_dir = Path(__file__).resolve().parents[4] / "static" / "images"
    local_path = static_images_dir / filename
    if local_path.is_file():
        return FileResponse(str(local_path))

    # 2. Try fetching from remote CDN with a short timeout
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
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
    except (httpx.TimeoutException, httpx.HTTPError):
        # Fallback to local placeholder image so cards never appear blank in the mobile app
        placeholder_path = static_images_dir / "placeholder.jpg"
        if placeholder_path.is_file():
            return FileResponse(str(placeholder_path), media_type="image/jpeg")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image {filename} not found on CDN"
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
        resp_status = getattr(getattr(e, 'response', None), 'status_code', None)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if resp_status == 404 else status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch video from CDN: {str(e)}"
        )


@router.get("/cdn/viewer/models/{filename}")
async def get_model_viewer_url(filename: str):
    """Get the viewer URL for a 3D model"""
    from app.core.config import settings
    clean_name = filename if filename.lower().endswith(('.glb', '.gltf')) else f"{filename}.glb"
    base = f"http://{settings.LOCAL_IP}:8000/api/v1"
    return {
        "filename": clean_name,
        "viewer_url": f"{base}/cdn/models/{clean_name}/viewer",
        "view_url": f"{base}/cdn/models/{clean_name}/viewer",
        "direct_url": f"{base}/cdn/models/{clean_name}"
    }


@router.get("/cdn/models/{filename}/viewer", response_class=HTMLResponse)
async def view_model_html(filename: str):
    """Serve an interactive 3D model viewer web page"""
    from app.core.config import settings
    clean_name = filename if filename.lower().endswith(('.glb', '.gltf')) else f"{filename}.glb"
    model_url = f"http://{settings.LOCAL_IP}:8000/api/v1/cdn/models/{clean_name}"
    script_url = f"http://{settings.LOCAL_IP}:8000/static/js/model-viewer.min.js"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>3D Monastery Model - {clean_name}</title>
  <script type="module" src="{script_url}"></script>
  <script type="module">
    if (!customElements.get('model-viewer')) {{
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      document.head.appendChild(script);
    }}
  </script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }}
    model-viewer {{
      width: 100%;
      height: 100%;
      --progress-bar-color: #38bdf8;
      --progress-bar-height: 4px;
    }}
    #badge {{
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 8px 18px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10;
    }}
  </style>
</head>
<body>
  <model-viewer
    src="{model_url}"
    alt="{clean_name}"
    auto-rotate
    rotation-per-second="25deg"
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1.5"
    shadow-softness="0.8"
    exposure="1.1"
    environment-image="neutral"
    loading="eager"
  >
  </model-viewer>
  <div id="badge">🖐 Drag to Rotate &bull; Pinch to Zoom</div>
</body>
</html>"""
    return HTMLResponse(content=html)


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
