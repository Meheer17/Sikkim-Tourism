from fastapi import APIRouter
from pydantic import BaseModel
from app.services.tts_service import synthesize_speech

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    lang: str  # en, hi, ne, as, ta, te

@router.post("/tts")
def generate_tts(req: TTSRequest):
    filename = synthesize_speech(req.text, req.lang)
    return {
        "status": "success",
        "file": filename,
        "url": f"/tts/audio/{filename}"
    }
