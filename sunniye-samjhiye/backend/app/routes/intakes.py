import random
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Intake
from ..schemas import IntakeCreate, IntakeUpdate, IntakeResponse, FactItem
from ..config import settings

router = APIRouter(prefix="/intakes", tags=["Intakes"])

def format_intake_response(intake: Intake) -> IntakeResponse:
    raw_facts = intake.get_facts_list()
    facts = []
    for f in raw_facts:
        try:
            facts.append(FactItem(**f))
        except Exception:
            pass

    return IntakeResponse(
        id=intake.id,
        patient_display_id=intake.patient_display_id,
        status=intake.status,
        created_at=intake.created_at,
        updated_at=intake.updated_at,
        audio_filename=intake.audio_filename,
        audio_duration_seconds=intake.audio_duration_seconds,
        audio_stored=intake.audio_stored,
        raw_transcript=intake.raw_transcript,
        reviewed_transcript=intake.reviewed_transcript,
        transcript_language=intake.transcript_language,
        facts=facts,
        summary_draft=intake.summary_draft,
        summary_approved=intake.summary_approved,
        approved_by_worker=intake.approved_by_worker,
        approved_at=intake.approved_at,
        worker_notes=intake.worker_notes,
        is_demo=intake.is_demo,
        provider=intake.provider,
        disclaimer=settings.PERSISTENT_DISCLAIMER
    )

@router.get("", response_model=List[IntakeResponse])
def list_intakes(db: Session = Depends(get_db)):
    intakes = db.query(Intake).order_by(Intake.updated_at.desc()).all()
    return [format_intake_response(i) for i in intakes]

@router.post("", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
def create_intake(data: IntakeCreate, db: Session = Depends(get_db)):
    # Generate non-identifying patient ID if omitted
    patient_id = data.patient_display_id
    if not patient_id or not patient_id.strip():
        patient_id = f"PT-{random.randint(1000, 9999)}"

    intake = Intake(
        patient_display_id=patient_id.strip(),
        status="draft",
        raw_transcript=data.raw_transcript,
        reviewed_transcript=data.reviewed_transcript or data.raw_transcript,
        transcript_language=data.transcript_language or "hi-IN",
        is_demo=data.is_demo,
        audio_stored=data.audio_stored,
        provider=data.provider or ("Sarvam AI" if not data.is_demo else "Demo Mode")
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)
    return format_intake_response(intake)

@router.get("/{intake_id}", response_model=IntakeResponse)
def get_intake(intake_id: str, db: Session = Depends(get_db)):
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake record not found")
    return format_intake_response(intake)

@router.patch("/{intake_id}", response_model=IntakeResponse)
def update_intake(intake_id: str, data: IntakeUpdate, db: Session = Depends(get_db)):
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake record not found")

    if data.status is not None:
        intake.status = data.status
    if data.reviewed_transcript is not None:
        intake.reviewed_transcript = data.reviewed_transcript
    if data.extraction_data is not None:
        intake.set_facts_list([f.model_dump() for f in data.extraction_data])
    if data.summary_draft is not None:
        intake.summary_draft = data.summary_draft
    if data.summary_approved is not None:
        intake.summary_approved = data.summary_approved
        if not intake.approved_at:
            intake.approved_at = datetime.datetime.now(datetime.timezone.utc)
    if data.approved_by_worker is not None:
        intake.approved_by_worker = data.approved_by_worker
        if not intake.approved_at:
            intake.approved_at = datetime.datetime.now(datetime.timezone.utc)
    if data.worker_notes is not None:
        intake.worker_notes = data.worker_notes

    intake.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(intake)
    return format_intake_response(intake)

@router.delete("/{intake_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_intake(intake_id: str, db: Session = Depends(get_db)):
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake record not found")
    db.delete(intake)
    db.commit()
    return None
