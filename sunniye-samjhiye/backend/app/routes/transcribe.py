import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from ..config import settings
from ..schemas import TranscribeResponse
from ..services.sarvam_service import sarvam_client
from ..services.demo_service import get_demo_presets

router = APIRouter(prefix="/transcribe", tags=["Transcription"])

@router.post("", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language_code: Optional[str] = Form(None),
    force_demo: bool = Form(False)
):
    # Check filename and extension
    filename = file.filename or "recording.webm"
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )

    # Read bytes and check size
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file exceeds maximum size limit of {settings.MAX_AUDIO_SIZE_BYTES // (1024 * 1024)} MB."
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty."
        )

    content_type = file.content_type or "audio/webm"

    # If force_demo or no key configured, use demo transcription
    if force_demo or settings.FORCE_DEMO_MODE or not sarvam_client.is_configured():
        demo_preset = get_demo_presets()[0]
        return TranscribeResponse(
            transcript=demo_preset["raw_transcript"],
            language_code=demo_preset["language_code"],
            is_demo=True,
            provider="Demo Mode (Offline Synthetic STT)",
            audio_stored=settings.STORE_AUDIO_FILES,
            message="Transcribed using synthetic demo engine."
        )

    try:
        result = await sarvam_client.transcribe_audio(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            language_code=language_code
        )
        return TranscribeResponse(
            transcript=result["transcript"],
            language_code=result.get("language_code", "hi-IN"),
            is_demo=False,
            provider=f"Sarvam AI ({settings.SARVAM_STT_MODEL})",
            audio_stored=settings.STORE_AUDIO_FILES,
            message="Successfully transcribed via Sarvam Saaras API."
        )
    except Exception as exc:
        # Fall back to demo mode with clear explanation
        demo_preset = get_demo_presets()[0]
        return TranscribeResponse(
            transcript=demo_preset["raw_transcript"],
            language_code=demo_preset["language_code"],
            is_demo=True,
            provider=f"Demo Mode (Fallback: {str(exc)})",
            audio_stored=settings.STORE_AUDIO_FILES,
            message=f"Live STT error: {str(exc)}. Switched to realistic synthetic transcript."
        )

