from gtts import gTTS
import uuid
import os

LANG_MAP = {
    "english": "en",
    "hindi": "hi",
    "nepali": "ne",
    "assamese": "bn",  # Use Bengali as closest alternative for Assamese
    "telugu": "te",
    "tamil": "ta",
}

def generate_tts(text: str, language: str):
    print(f"[TTS Service] Starting conversion - Language: {language}")
    
    lang_code = LANG_MAP.get(language.lower())
    if not lang_code:
        raise Exception(f"Language '{language}' not supported. Available: {list(LANG_MAP.keys())}")

    # Ensure directory exists
    os.makedirs("static/audio", exist_ok=True)
    
    filename = f"{uuid.uuid4()}.mp3"
    path = f"static/audio/{filename}"
    
    print(f"[TTS Service] Generating audio file: {path}")
    
    try:
        tts = gTTS(text=text, lang=lang_code)
        tts.save(path)
        print(f"[TTS Service] File saved successfully: {path}")
        
        # Verify file was created
        if not os.path.exists(path):
            raise Exception(f"File was not created at {path}")
            
        file_size = os.path.getsize(path)
        print(f"[TTS Service] File size: {file_size} bytes")
        
    except Exception as e:
        print(f"[TTS Service] Error during gTTS conversion: {str(e)}")
        raise Exception(f"Failed to generate audio: {str(e)}")

    return filename
