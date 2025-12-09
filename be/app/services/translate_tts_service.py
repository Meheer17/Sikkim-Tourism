import logging

logger = logging.getLogger(__name__)

LANG_MAP = {
    "english": "en",
    "hindi": "hi",
    "nepali": "ne",
    "assamese": "bn",
    "telugu": "te",
    "tamil": "ta",
}

def translate_and_convert_to_speech(text: str, target_language: str, source_language: str = "auto"):
    """
    Placeholder: Offline translation & TTS disabled.
    Use /api/v1/tts endpoint instead for offline TTS via Piper.
    """
    raise Exception("Online translation & TTS (gTTS, googletrans) removed for offline-only mode. Use /api/v1/tts endpoint instead.")
