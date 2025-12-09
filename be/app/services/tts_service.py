import os
import subprocess
import uuid
from fastapi import HTTPException

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPER_DIR = os.path.join(BASE_DIR, "..", "piper")
PIPER_EXE = os.path.join(PIPER_DIR, "piper.exe")
MODEL_DIR = os.path.join(PIPER_DIR, "models")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "static", "audio")

# Models physically present in be/piper/models
LANG_MODELS = {
    "en": "en_US-amy-medium.onnx",
    "hi": "hi_IN-priyamvada-medium.onnx",
    "ne": "ne_NP-chitwan-medium.onnx",
    "te": "te_IN-padmavathi-medium.onnx",
}

# Friendly aliases from frontend names to Piper lang codes
LANG_ALIASES = {
    "english": "en",
    "hindi": "hi",
    "nepali": "ne",
    "telugu": "te",
}


def _check_paths(model_path: str):
    if not os.path.isfile(PIPER_EXE):
        raise HTTPException(status_code=500, detail="piper.exe not found. Place it in be/piper/")
    if not os.path.isfile(model_path):
        raise HTTPException(status_code=500, detail=f"Model missing: {os.path.basename(model_path)}. Place it in be/piper/models/")


def synthesize_speech(text: str, lang: str) -> str:
    lang = (lang or "").lower()
    lang = LANG_ALIASES.get(lang, lang)

    if lang not in LANG_MODELS:
        raise HTTPException(status_code=400, detail=f"Language not supported. Available: {list(LANG_MODELS.keys())}")

    model_name = LANG_MODELS[lang]
    model_path = os.path.join(MODEL_DIR, model_name)
    _check_paths(model_path)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_filename = f"{uuid.uuid4()}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    cmd = [
        PIPER_EXE,
        "--model",
        model_path,
        "--output_file",
        output_path,
    ]

    try:
        # Send text via stdin to avoid shell quoting issues
        subprocess.run(cmd, input=text, text=True, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {e.stderr or e.stdout or e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

    if not os.path.isfile(output_path):
        raise HTTPException(status_code=500, detail="TTS Error: audio file was not created")

    return output_filename


def generate_tts(text: str, lang: str) -> str:
    """Public API used by routes; returns filename in static/audio."""
    return synthesize_speech(text, lang)
