from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import traceback
# Use absolute import so FastAPI app runs from project root without relative import issues
from app.services.tts_service import generate_tts

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language: str

@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    try:
        print(f"[TTS] Received request - Text: '{req.text[:50]}...', Language: {req.language}")
        filename = generate_tts(req.text, req.language)
        print(f"[TTS] Successfully generated: {filename}")
        return {"audio_url": f"/static/audio/{filename}", "success": True}
    except Exception as e:
        print(f"[TTS] Error: {str(e)}")
        print(f"[TTS] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

