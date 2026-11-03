import pytest
from app.models import Intake
from app.services.pdf_service import generate_intake_pdf

def test_pdf_generation():
    intake = Intake(
        patient_display_id="PT-5566",
        status="approved",
        raw_transcript="Patient reports joint ache for three days.",
        reviewed_transcript="Patient reports joint ache for three days.",
        summary_approved="Patient reports 3 days of joint ache.",
        approved_by_worker="Sister Anjali",
        audio_stored=False,
        provider="Sarvam AI"
    )
    intake.set_facts_list([
        {
            "id": "1",
            "category": "patient_concern",
            "label": "Patient-Reported Concern",
            "value": "Joint ache",
            "quote": "joint ache for three days",
            "status": "confirmed",
            "confidence": 0.95
        }
    ])

    pdf_bytes = generate_intake_pdf(intake)
    assert pdf_bytes is not None
    assert len(pdf_bytes) > 500
    # PDF magic bytes
    assert pdf_bytes.startswith(b"%PDF-")

