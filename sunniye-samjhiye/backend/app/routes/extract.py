from fastapi import APIRouter, HTTPException, status
from ..schemas import ExtractFactsRequest, ExtractFactsResponse
from ..services.extraction_service import extract_structured_facts
from ..config import settings

router = APIRouter(prefix="/extract", tags=["Extraction"])

@router.post("", response_model=ExtractFactsResponse)
async def extract_facts(request: ExtractFactsRequest):
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is empty. Provide a transcript to extract facts."
        )

    facts, is_demo, provider = await extract_structured_facts(
        transcript=request.transcript.strip(),
        patient_display_id=request.patient_display_id or "PT-XXXX",
        force_demo=request.force_demo
    )

    return ExtractFactsResponse(
        facts=facts,
        is_demo=is_demo,
        provider=provider,
        disclaimer=settings.PERSISTENT_DISCLAIMER
    )

