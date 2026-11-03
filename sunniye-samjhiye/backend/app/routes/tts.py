from fastapi import APIRouter
from ..schemas import TTSRequest, TTSResponse
from ..services.sarvam_service import sarvam_client
from ..config import settings

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

@router.post("", response_model=TTSResponse)
async def play_tts(request: TTSRequest):
    if request.force_demo or settings.FORCE_DEMO_MODE or not sarvam_client.is_configured():
        return TTSResponse(
            audio_base64=None,
            is_demo=True,
            provider="Demo Mode",
            message="TTS playback in demo mode uses the browser's built-in Web Speech API voice."
        )

    try:
        audio_b64 = await sarvam_client.text_to_speech(
            text=request.text,
            target_language_code=request.language_code,
            speaker=request.speaker
        )
        return TTSResponse(
            audio_base64=audio_b64,
            is_demo=False,
            provider=f"Sarvam AI ({settings.SARVAM_TTS_MODEL})",
            message="Audio generated successfully via Sarvam Bulbul."
        )
    except Exception as exc:
        return TTSResponse(
            audio_base64=None,
            is_demo=True,
            provider=f"Demo Fallback ({str(exc)})",
            message=f"Sarvam Bulbul error: {str(exc)}. Falling back to browser speech synthesis."
        )

