#!/usr/bin/env python
"""Test offline translation and TTS"""
import sys
sys.path.insert(0, '.')

from app.services.translate_tts_service import translate_and_convert_to_speech

print("Testing offline translation + TTS...")
try:
    result = translate_and_convert_to_speech(
        text="Hello, how are you today?",
        target_language="hindi",
        source_language="auto"
    )
    print("\n✅ SUCCESS!")
    print(f"Original: Hello, how are you today?")
    print(f"Translated: {result['translated_text']}")
    print(f"Audio URL: {result['audio_url']}")
    print(f"Mode: {result['mode']}")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
