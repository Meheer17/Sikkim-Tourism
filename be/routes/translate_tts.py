from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import traceback
from app.services.translate_tts_service import translate_and_convert_to_speech

router = APIRouter()

class TranslateTTSRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

@router.post("/translate-tts")
async def translate_and_tts(req: TranslateTTSRequest):
    try:
        print(f"[Translate-TTS API] Received request - Text: '{req.text[:50]}...', Target: {req.target_language}")
        result = translate_and_convert_to_speech(req.text, req.target_language, req.source_language)
        print(f"[Translate-TTS API] Successfully processed")
        return {"success": True, **result}
    except Exception as e:
        print(f"[Translate-TTS API] Error: {str(e)}")
        print(f"[Translate-TTS API] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
