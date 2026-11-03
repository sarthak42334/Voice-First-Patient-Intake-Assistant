import pytest
from app.services.sarvam_service import SarvamService
from app.services.extraction_service import extract_structured_facts
from app.services.summary_service import generate_intake_summary
from app.services.demo_service import get_demo_presets

@pytest.mark.anyio
async def test_sarvam_service_configuration():
    service = SarvamService(api_key="sk_test_key_12345")
    assert service.is_configured() is True
    
    empty_service = SarvamService(api_key="")
    assert empty_service.is_configured() is False

@pytest.mark.anyio
async def test_extraction_demo_mode():
    preset = get_demo_presets()[0]
    facts, is_demo, provider = await extract_structured_facts(
        transcript=preset["raw_transcript"],
        patient_display_id=preset["patient_display_id"],
        force_demo=True
    )
    assert is_demo is True
    assert "Demo Mode" in provider
    assert len(facts) == 6
    # Check that quotes are populated from preset
    assert any(f.category == "patient_concern" and len(f.quote) > 0 for f in facts)

@pytest.mark.anyio
async def test_summary_demo_mode():
    preset = get_demo_presets()[0]
    facts, _, _ = await extract_structured_facts(
        transcript=preset["raw_transcript"],
        patient_display_id=preset["patient_display_id"],
        force_demo=True
    )
    summary, is_demo, provider = await generate_intake_summary(
        patient_display_id=preset["patient_display_id"],
        facts=facts,
        transcript=preset["raw_transcript"],
        force_demo=True
    )
    assert is_demo is True
    assert preset["patient_display_id"] in summary
    assert "PATIENT-REPORTED INTAKE SUMMARY" in summary

