import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

FactCategory = Literal[
    "patient_concern",
    "symptoms_duration",
    "relevant_history",
    "current_medications",
    "allergies",
    "other_reported"
]

FactStatus = Literal[
    "confirmed",
    "edited",
    "rejected",
    "not_provided",
    "unclear",
    "needs_review"
]

class FactItem(BaseModel):
    id: str = Field(..., description="Unique identifier for the fact item")
    category: FactCategory
    label: str = Field(..., description="Human readable category title")
    value: str = Field(..., description="Explicitly reported information or 'Not provided'/'Unclear'")
    quote: str = Field(default="", description="Verbatim quote from transcript supporting this fact")
    status: FactStatus = Field(default="needs_review", description="Verification status")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    worker_note: Optional[str] = Field(default=None, description="Optional note added by healthcare worker")

class IntakeCreate(BaseModel):
    patient_display_id: Optional[str] = None
    raw_transcript: Optional[str] = None
    reviewed_transcript: Optional[str] = None
    transcript_language: Optional[str] = "hi-IN"
    is_demo: bool = False
    audio_stored: bool = False
    provider: Optional[str] = None

class IntakeUpdate(BaseModel):
    status: Optional[str] = None
    reviewed_transcript: Optional[str] = None
    extraction_data: Optional[List[FactItem]] = None
    summary_draft: Optional[str] = None
    summary_approved: Optional[str] = None
    approved_by_worker: Optional[str] = None
    worker_notes: Optional[str] = None

class IntakeResponse(BaseModel):
    id: str
    patient_display_id: str
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    audio_filename: Optional[str] = None
    audio_duration_seconds: Optional[float] = None
    audio_stored: bool
    raw_transcript: Optional[str] = None
    reviewed_transcript: Optional[str] = None
    transcript_language: Optional[str] = None
    facts: List[FactItem] = []
    summary_draft: Optional[str] = None
    summary_approved: Optional[str] = None
    approved_by_worker: Optional[str] = None
    approved_at: Optional[datetime.datetime] = None
    worker_notes: Optional[str] = None
    is_demo: bool
    provider: str
    disclaimer: str

    model_config = {"from_attributes": True}

class TranscribeResponse(BaseModel):
    transcript: str
    language_code: Optional[str] = "hi-IN"
    is_demo: bool
    provider: str
    audio_stored: bool = False
    message: Optional[str] = None

class ExtractFactsRequest(BaseModel):
    transcript: str
    patient_display_id: Optional[str] = None
    force_demo: bool = False

class ExtractFactsResponse(BaseModel):
    facts: List[FactItem]
    is_demo: bool
    provider: str
    disclaimer: str

class SummaryRequest(BaseModel):
    transcript: str
    facts: List[FactItem]
    patient_display_id: Optional[str] = None
    force_demo: bool = False

class SummaryResponse(BaseModel):
    summary: str
    is_demo: bool
    provider: str
    disclaimer: str

class TTSRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    speaker: str = "shubh"
    force_demo: bool = False

class TTSResponse(BaseModel):
    audio_base64: Optional[str] = None
    is_demo: bool
    provider: str
    message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    sarvam_configured: bool
    demo_mode_active: bool
    model_stt: str
    model_llm: str
    model_tts: str
    disclaimer: str
