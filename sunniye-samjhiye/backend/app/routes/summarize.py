from fastapi import APIRouter, HTTPException, status
from ..schemas import SummaryRequest, SummaryResponse
from ..services.summary_service import generate_intake_summary
from ..config import settings

router = APIRouter(prefix="/summarize", tags=["Summary"])

@router.post("", response_model=SummaryResponse)
async def summarize_intake(request: SummaryRequest):
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is empty. Provide a transcript to summarize."
        )

    summary_text, is_demo, provider = await generate_intake_summary(
        patient_display_id=request.patient_display_id or "PT-XXXX",
        facts=request.facts,
        transcript=request.transcript.strip(),
        force_demo=request.force_demo
    )

    return SummaryResponse(
        summary=summary_text,
        is_demo=is_demo,
        provider=provider,
        disclaimer=settings.PERSISTENT_DISCLAIMER
    )

