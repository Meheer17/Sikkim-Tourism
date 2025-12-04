from io import BytesIO
import asyncio
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse

try:
	from PIL import Image  # type: ignore
except Exception:  # pragma: no cover
	Image = None  # type: ignore

try:
	from pydub import AudioSegment  # type: ignore
except Exception:  # pragma: no cover
	AudioSegment = None  # type: ignore

try:
	import moviepy.editor as mp  # type: ignore
except Exception:  # pragma: no cover
	mp = None  # type: ignore

router = APIRouter()

def _process_image(data: bytes, quality: int, target_format: Optional[str]) -> tuple[BytesIO, str]:
	if Image is None:
		raise RuntimeError("Pillow not installed")
	try:
		img = Image.open(BytesIO(data))
	except Exception as e:  # noqa: BLE001
		raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

	out_format = (target_format or img.format or "JPEG").upper()
	if out_format == "JPG":
		out_format = "JPEG"
	if out_format not in {"JPEG", "WEBP", "PNG"}:
		raise HTTPException(status_code=400, detail="Unsupported format (jpeg|webp|png)")

	if out_format in {"JPEG", "WEBP"} and img.mode in ("RGBA", "P"):
		img = img.convert("RGB")

	buf = BytesIO()
	save_kwargs: dict = {}
	if out_format in {"JPEG", "WEBP"}:
		save_kwargs["quality"] = quality
		if out_format == "WEBP":
			save_kwargs["method"] = 6
	elif out_format == "PNG":
		save_kwargs["optimize"] = True

	img.save(buf, format=out_format, **save_kwargs)
	buf.seek(0)
	media_type = {"JPEG": "image/jpeg", "WEBP": "image/webp", "PNG": "image/png"}[out_format]
	return buf, media_type


@router.post("/image")
async def compress_image(
	file: UploadFile = File(..., description="Image to compress"),
	quality: int = Form(75, ge=1, le=100, description="Quality for JPEG/WEBP (1-100)"),
	format: Optional[str] = Form(None, description="Target format: jpeg|webp|png"),
):
	data = await file.read()
	try:
		buf, media_type = await asyncio.to_thread(_process_image, data, quality, format)
	except RuntimeError as e:
		raise HTTPException(status_code=500, detail=str(e))
	return StreamingResponse(buf, media_type=media_type)

def _process_audio(data: bytes, bitrate: str, target_format: str) -> tuple[BytesIO, str]:
	if AudioSegment is None:
		raise RuntimeError("pydub not installed")
	try:
		audio = AudioSegment.from_file(BytesIO(data))
	except Exception as e:  # noqa: BLE001
		raise HTTPException(status_code=400, detail=f"Invalid audio file: {e}")

	out_format = target_format.lower()
	if out_format not in {"mp3", "aac", "wav"}:
		raise HTTPException(status_code=400, detail="Unsupported audio format (mp3|aac|wav)")

	buf = BytesIO()
	export_kwargs = {}
	if out_format in {"mp3", "aac"}:
		export_kwargs["bitrate"] = bitrate
	try:
		audio.export(buf, format=out_format, **export_kwargs)  # type: ignore
	except Exception as e:  # noqa: BLE001
		raise HTTPException(status_code=500, detail=f"Audio compression failed (ffmpeg installed?): {e}")
	buf.seek(0)
	media_type = {"mp3": "audio/mpeg", "aac": "audio/aac", "wav": "audio/wav"}[out_format]
	return buf, media_type


@router.post("/audio")
async def compress_audio(
	file: UploadFile = File(..., description="Audio to compress"),
	bitrate: str = Form("128k", description="Bitrate e.g. 96k,128k,192k"),
	format: str = Form("mp3", description="Output format: mp3|aac|wav"),
):
	data = await file.read()
	try:
		buf, media_type = await asyncio.to_thread(_process_audio, data, bitrate, format)
	except RuntimeError as e:
		raise HTTPException(status_code=500, detail=str(e))
	return StreamingResponse(buf, media_type=media_type)
