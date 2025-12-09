from googletrans import Translator
from gtts import gTTS
import uuid
import os
import logging

logger = logging.getLogger(__name__)

LANG_MAP = {
    "english": "en",
    "hindi": "hi",
    "nepali": "ne",
    "assamese": "bn",  # Use Bengali as closest alternative for Assamese
    "telugu": "te",
    "tamil": "ta",
}

def translate_and_convert_to_speech(text: str, target_language: str, source_language: str = "auto"):
    """
    Translate text to target language and convert to speech
    Returns MP3 file path
    """
    try:
        logger.info(f"[Translate & TTS] Starting - Target: {target_language}, Source: {source_language}")
        
        target_code = LANG_MAP.get(target_language.lower())
        if not target_code:
            raise Exception(f"Language '{target_language}' not supported. Available: {list(LANG_MAP.keys())}")
        
        # Step 1: Translate
        logger.info(f"[Translate & TTS] Translating text...")
        source_code = LANG_MAP.get(source_language.lower(), "auto") if source_language != "auto" else "auto"
        translator = Translator()
        translation_result = translator.translate(text, src=source_code, dest=target_code)
        translated_text = translation_result.text
        logger.info(f"[Translate & TTS] Translation successful: '{translated_text[:50]}...'")
        
        # Step 2: Convert to speech
        logger.info(f"[Translate & TTS] Converting to speech...")
        os.makedirs("static/audio", exist_ok=True)
        
        filename = f"{uuid.uuid4()}.mp3"
        path = f"static/audio/{filename}"
        
        tts = gTTS(text=translated_text, lang=target_code)
        tts.save(path)
        logger.info(f"[Translate & TTS] Audio file saved: {path}")
        
        # Verify file was created
        if not os.path.exists(path):
            raise Exception(f"Audio file was not created at {path}")
            
        file_size = os.path.getsize(path)
        logger.info(f"[Translate & TTS] File size: {file_size} bytes")
        
        return {
            "filename": filename,
            "audio_url": f"/static/audio/{filename}",
            "translated_text": translated_text,
            "target_language": target_code
        }
        
    except Exception as e:
        logger.error(f"[Translate & TTS] Error: {str(e)}")
        raise Exception(f"Failed to translate and convert: {str(e)}")
