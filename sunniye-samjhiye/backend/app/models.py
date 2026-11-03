import datetime
import uuid
import json
from sqlalchemy import Column, String, Text, DateTime, Boolean, Float
from .database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class Intake(Base):
    __tablename__ = "intakes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_display_id = Column(String(32), nullable=False, index=True)
    status = Column(String(32), default="draft", nullable=False)  # draft, transcript_reviewed, facts_reviewed, approved, archived
    
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    
    # Audio metadata
    audio_filename = Column(String(255), nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    audio_stored = Column(Boolean, default=False, nullable=False)
    
    # Transcripts
    raw_transcript = Column(Text, nullable=True)
    reviewed_transcript = Column(Text, nullable=True)
    transcript_language = Column(String(16), nullable=True)  # e.g., 'hi-IN', 'en-IN', 'te-IN'
    
    # Extracted Facts (stored as JSON array of dicts)
    extraction_data = Column(Text, nullable=True, default="[]")
    
    # Summaries
    summary_draft = Column(Text, nullable=True)
    summary_approved = Column(Text, nullable=True)
    
    # Healthcare worker review and sign-off
    approved_by_worker = Column(String(128), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    worker_notes = Column(Text, nullable=True)
    
    # Provider metadata
    is_demo = Column(Boolean, default=False, nullable=False)
    provider = Column(String(128), default="Sarvam AI", nullable=False)

    def get_facts_list(self):
        if not self.extraction_data:
            return []
        try:
            return json.loads(self.extraction_data)
        except Exception:
            return []

    def set_facts_list(self, facts: list):
        self.extraction_data = json.dumps(facts, ensure_ascii=False)
