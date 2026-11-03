import pytest
from app.services.extraction_service import validate_and_sanitize_facts, fallback_heuristic_extraction
from app.services.summary_service import generate_offline_summary
from app.config import settings

def test_missing_items_labeled_not_provided():
    raw_facts = [
        {
            "category": "patient_concern",
            "value": "Mild headache",
            "quote": "Mild headache",
            "status": "confirmed"
        }
        # medications and allergies completely omitted
    ]
    transcript = "I have a mild headache."
    cleaned = validate_and_sanitize_facts(raw_facts, transcript)

    # Must contain all 6 categories
    cat_map = {f.category: f for f in cleaned}
    assert len(cleaned) == 6
    assert "allergies" in cat_map
    assert "current_medications" in cat_map

    # Allergies and medications must be strictly 'Not provided'
    assert cat_map["allergies"].value == "Not provided"
    assert cat_map["allergies"].status == "not_provided"
    assert cat_map["allergies"].quote == ""

    assert cat_map["current_medications"].value == "Not provided"
    assert cat_map["current_medications"].status == "not_provided"

def test_diagnostic_injection_sanitization():
    raw_facts = [
        {
            "category": "patient_concern",
            "value": "Patient is diagnosed with acute pneumonia and should treat with azithromycin",
            "quote": "I have cough",
            "status": "confirmed"
        }
    ]
    transcript = "I have cough"
    cleaned = validate_and_sanitize_facts(raw_facts, transcript)
    concern = next(f for f in cleaned if f.category == "patient_concern")
    
    # Must not contain diagnostic assertion "diagnosed with" or "treat with"
    assert "diagnosed with" not in concern.value.lower()
    assert "treat with" not in concern.value.lower()

def test_summary_includes_persistent_disclaimer():
    transcript = "I fell in the bathroom two days ago."
    facts = fallback_heuristic_extraction(transcript)
    summary = generate_offline_summary("PT-TEST", facts, transcript)
    
    assert settings.PERSISTENT_DISCLAIMER in summary
    assert "PT-TEST" in summary

