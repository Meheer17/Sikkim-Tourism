from googletrans import Translator
import logging

logger = logging.getLogger(__name__)

LANG_MAP = {
    "english": "en",
    "hindi": "hi",
    "nepali": "ne",
    "assamese": "as",
    "telugu": "te",
    "tamil": "ta",
}

def translate_text(text: str, target_language: str, source_language: str = "auto"):
    """
    Translate text from source language to target language
    """
    try:
        logger.info(f"[Translation] Starting translation to {target_language}")
        
        target_code = LANG_MAP.get(target_language.lower())
        if not target_code:
            raise Exception(f"Language '{target_language}' not supported. Available: {list(LANG_MAP.keys())}")
        
        source_code = LANG_MAP.get(source_language.lower(), "auto") if source_language != "auto" else "auto"
        
        translator = Translator()
        result = translator.translate(text, src=source_code, dest=target_code)
        
        logger.info(f"[Translation] Successfully translated from {result.src} to {target_code}")
        
        return {
            "translated_text": result.text,
            "source_language": result.src,
            "target_language": target_code,
            "original_text": text
        }
    except Exception as e:
        logger.error(f"[Translation] Error: {str(e)}")
        raise Exception(f"Translation failed: {str(e)}")
