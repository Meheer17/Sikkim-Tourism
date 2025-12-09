from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import traceback
from app.services.translation_service import translate_text

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

@router.post("/translate")
async def translate(req: TranslationRequest):
    try:
        print(f"[Translation API] Received request - Text: '{req.text[:50]}...', Target: {req.target_language}, Source: {req.source_language}")
        result = translate_text(req.text, req.target_language, req.source_language)
        print(f"[Translation API] Successfully translated")
        return {"success": True, **result}
    except Exception as e:
        print(f"[Translation API] Error: {str(e)}")
        print(f"[Translation API] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
