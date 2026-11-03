from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Intake
from ..services.pdf_service import generate_intake_pdf

router = APIRouter(prefix="/intakes", tags=["Export"])

@router.get("/{intake_id}/pdf")
def export_intake_pdf(intake_id: str, db: Session = Depends(get_db)):
    intake = db.query(Intake).filter(Intake.id == intake_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake record not found")

    pdf_bytes = generate_intake_pdf(intake)
    safe_patient_id = intake.patient_display_id.replace(" ", "_")
    filename = f"intake_{safe_patient_id}_{intake.id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )

