from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TranslationRequest(BaseModel):
	text: str
	target_language: str
	source_language: str | None = "auto"


@router.post("/translate")
async def translate_text(req: TranslationRequest):
	"""Placeholder offline translation. Echoes text since online translate was removed."""
	return {
		"translated_text": req.text,
		"target_language": req.target_language,
		"source_language": req.source_language or "auto",
		"note": "Offline placeholder: add real translator to enable translation",
	}
