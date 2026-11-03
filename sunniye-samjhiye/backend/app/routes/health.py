from fastapi import APIRouter
from ..config import settings
from ..schemas import HealthResponse
from ..services.sarvam_service import sarvam_client

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    sarvam_ready = sarvam_client.is_configured()
    demo_active = settings.FORCE_DEMO_MODE or not sarvam_ready
    return HealthResponse(
        status="ok",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        sarvam_configured=sarvam_ready,
        demo_mode_active=demo_active,
        model_stt=settings.SARVAM_STT_MODEL,
        model_llm=settings.SARVAM_LLM_MODEL,
        model_tts=settings.SARVAM_TTS_MODEL,
        disclaimer=settings.PERSISTENT_DISCLAIMER
    )

