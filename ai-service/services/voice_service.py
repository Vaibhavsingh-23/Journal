"""
voice_service.py
================
This service handles voice transcription using the local Whisper model.
It runs entirely on your local machine, requiring no API keys or internet connection.
"""

import os
import tempfile
import whisper

# Load the model ONCE at the module level (not inside the function)
model = whisper.load_model("base")
print("Whisper model loaded and ready")


def transcribe_audio(audio_file_path: str) -> dict:
    """
    Transcribe audio file to text using local Whisper model
    """
    try:
        import os
        file_size = os.path.getsize(audio_file_path)
        print(f"Transcribing file: {audio_file_path} (size: {file_size} bytes)")
        
        result = model.transcribe(audio_file_path)
        transcript = result["text"].strip()
        language = result["language"]
        
        print(f"Transcription result: '{transcript}' (Language: {language})")
        
        return {
            "transcript": transcript,
            "language": language,
            "status": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "transcript": "",
            "language": "unknown",
            "message": str(e)
        }


def save_temp_audio(audio_bytes: bytes, extension: str = "webm") -> str:
    """
    Save uploaded audio bytes to a temporary file, return file path
    """
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False)
        tmp.write(audio_bytes)
        tmp.close()
        return tmp.name
    except Exception as e:
        print(f"Error saving temp audio: {e}")
        return ""


def cleanup_temp_file(file_path: str) -> None:
    """
    Delete temporary audio file after transcription
    """
    try:
        os.remove(file_path)
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Warning: could not delete temporary file {file_path}: {e}")
