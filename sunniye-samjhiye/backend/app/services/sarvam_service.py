import os
import json
import logging
from typing import Dict, Any, Optional, List
import httpx
from ..config import settings

logger = logging.getLogger("sarvam_service")

class SarvamService:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.SARVAM_API_KEY
        self.base_url = (base_url or settings.SARVAM_BASE_URL).rstrip("/")
        self.stt_model = settings.SARVAM_STT_MODEL
        self.llm_model = settings.SARVAM_LLM_MODEL
        self.tts_model = settings.SARVAM_TTS_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def _get_headers(self, content_type: Optional[str] = "application/json") -> Dict[str, str]:
        headers = {
            "api-subscription-key": self.api_key
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    async def transcribe_audio(
        self,
        file_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribes audio using Sarvam Saaras Speech-to-Text API.
        """
        if not self.is_configured():
            raise ValueError("Sarvam API key is not configured.")

        url = f"{self.base_url}/speech-to-text"
        
        data = {
            "model": self.stt_model,
            "mode": "transcribe"
        }
        if language_code:
            data["language_code"] = language_code

        files = {
            "file": (filename, file_bytes, content_type)
        }

        # Do not include Content-Type header manually; httpx multipart sets it with boundary
        headers = {"api-subscription-key": self.api_key}

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(url, headers=headers, data=data, files=files)
                if response.status_code != 200:
                    logger.error(f"Sarvam STT failed: {response.status_code} - {response.text}")
                    raise RuntimeError(f"Sarvam STT API error ({response.status_code}): {response.text}")

                res_json = response.json()
                transcript = res_json.get("transcript", "")
                detected_lang = res_json.get("language_code", language_code or "hi-IN")
                return {
                    "transcript": transcript,
                    "language_code": detected_lang,
                    "raw_response": res_json
                }
            except httpx.RequestError as exc:
                logger.error(f"Sarvam STT request error: {str(exc)}")
                raise RuntimeError(f"Sarvam STT connection error: {str(exc)}")

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1500
    ) -> str:
        """
        Calls Sarvam LLM Chat Completions endpoint (e.g. sarvam-105b).
        """
        if not self.is_configured():
            raise ValueError("Sarvam API key is not configured.")

        url = f"{self.base_url}/v1/chat/completions"
        headers = self._get_headers("application/json")
        payload = {
            "model": model or self.llm_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Sarvam LLM failed: {response.status_code} - {response.text}")
                    raise RuntimeError(f"Sarvam LLM API error ({response.status_code}): {response.text}")

                res_json = response.json()
                choices = res_json.get("choices", [])
                if choices and len(choices) > 0:
                    content = choices[0].get("message", {}).get("content", "")
                    return content
                return ""
            except httpx.RequestError as exc:
                logger.error(f"Sarvam LLM connection error: {str(exc)}")
                raise RuntimeError(f"Sarvam LLM connection error: {str(exc)}")

    async def text_to_speech(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "shubh"
    ) -> Optional[str]:
        """
        Converts text to speech using Sarvam Bulbul API. Returns base64 audio string.
        """
        if not self.is_configured():
            raise ValueError("Sarvam API key is not configured.")

        url = f"{self.base_url}/text-to-speech"
        headers = self._get_headers("application/json")
        payload = {
            "text": text,
            "target_language_code": target_language_code,
            "speaker": speaker,
            "model": self.tts_model
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Sarvam TTS failed: {response.status_code} - {response.text}")
                    raise RuntimeError(f"Sarvam TTS API error ({response.status_code}): {response.text}")

                res_json = response.json()
                audios = res_json.get("audios", [])
                if audios and len(audios) > 0:
                    return audios[0]
                return None
            except httpx.RequestError as exc:
                logger.error(f"Sarvam TTS connection error: {str(exc)}")
                raise RuntimeError(f"Sarvam TTS connection error: {str(exc)}")

sarvam_client = SarvamService()
