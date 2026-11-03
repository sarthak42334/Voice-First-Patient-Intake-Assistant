import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sunniye, Samjhiye"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Sarvam AI
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_BASE_URL: str = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
    SARVAM_STT_MODEL: str = os.getenv("SARVAM_STT_MODEL", "saaras:v4")
    SARVAM_LLM_MODEL: str = os.getenv("SARVAM_LLM_MODEL", "sarvam-105b")
    SARVAM_TTS_MODEL: str = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
    
    # Force demo mode or auto-fallback
    FORCE_DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "t", "yes")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sunniye_samjhiye.db")
    
    # Audio settings
    MAX_AUDIO_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_AUDIO_EXTENSIONS: tuple = (".wav", ".mp3", ".m4a", ".ogg", ".webm", ".aac")
    STORE_AUDIO_FILES: bool = os.getenv("STORE_AUDIO_FILES", "false").lower() in ("true", "1")
    
    # Persistent Notice & Guardrail
    PERSISTENT_DISCLAIMER: str = (
        "This tool records and organizes reported information. "
        "It does not diagnose, recommend treatment, or replace a healthcare professional."
    )

settings = Settings()
