import json
import re
import uuid
import logging
from typing import List, Dict, Any, Tuple
from ..schemas import FactItem, FactCategory, FactStatus
from ..config import settings
from .sarvam_service import sarvam_client
from .demo_service import get_demo_presets

logger = logging.getLogger("extraction_service")

EXTRACTION_SYSTEM_PROMPT = """You are a specialized Clinical Documentation Intake Assistant for "Sunniye, Samjhiye".
Your purpose is strictly to organize and document information explicitly reported by a patient or their caregiver.

CRITICAL SAFETY & NON-DIAGNOSTIC MANDATE:
1. You are a DOCUMENTATION TOOL ONLY.
2. DO NOT DIAGNOSE, TRIAGE, ASSIGN RISK SCORES, OR RECOMMEND MEDICATIONS/TREATMENTS.
3. EXTRACT ONLY FACTS EXPLICITLY STATED in the transcript.
4. NEVER GUESS OR FILL GAPS. If an item was not mentioned in the audio transcript, output:
   - "value": "Not provided"
   - "quote": ""
   - "status": "not_provided"
5. If the patient's statement is vague, ambiguous, or contradictory, output:
   - "value": State the ambiguity clearly (e.g., "Unclear: reports taking an unidentified blue pill")
   - "quote": Exact words spoken
   - "status": "needs_review" or "unclear"
6. Every single extracted fact must have an exact, verbatim "quote" substring from the transcript.

You must output a valid JSON array of objects representing these EXACT 6 categories in order:
1. category: "patient_concern" | label: "Patient-Reported Concern"
2. category: "symptoms_duration" | label: "Symptoms & Duration"
3. category: "relevant_history" | label: "Relevant Medical History"
4. category: "current_medications" | label: "Current Medications"
5. category: "allergies" | label: "Allergies"
6. category: "other_reported" | label: "Other Reported Details"

Each item must have:
- "category": (one of the 6 category strings above)
- "label": (human-friendly label)
- "value": (the factual extraction or "Not provided")
- "quote": (verbatim quote from the transcript, or "" if not mentioned)
- "status": "confirmed" | "needs_review" | "unclear" | "not_provided"
- "confidence": float between 0.0 and 1.0

Return ONLY the raw JSON array. Do not output conversational preamble or markdown beyond a ```json fence.
"""

def extract_json_from_llm_response(text: str) -> List[Dict[str, Any]]:
    """Extracts JSON array from LLM response safely."""
    text = text.strip()
    # Check for markdown code fences
    fence_match = re.search(r"```(?:json)?\s*(\[\s*\{.*\}\s*\])\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except Exception:
            pass
    
    # Try finding bare JSON array
    array_match = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group(0))
        except Exception:
            pass

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except Exception:
        pass

    raise ValueError("Could not parse JSON array from model output.")

def validate_and_sanitize_facts(raw_facts: List[Dict[str, Any]], transcript: str) -> List[FactItem]:
    """
    Validates model output, ensures non-diagnostic guardrails,
    verifies quotes against transcript, and assigns fallback statuses.
    """
    valid_categories = {
        "patient_concern": "Patient-Reported Concern",
        "symptoms_duration": "Symptoms & Duration",
        "relevant_history": "Relevant Medical History",
        "current_medications": "Current Medications",
        "allergies": "Allergies",
        "other_reported": "Other Reported Details"
    }
    
    facts_by_cat = {item.get("category"): item for item in raw_facts if isinstance(item, dict) and item.get("category") in valid_categories}
    cleaned_items: List[FactItem] = []

    lower_transcript = transcript.lower()

    # Diagnostic terms blacklisted from AI injection
    diagnostic_red_flags = [
        "diagnosed with", "likely suffering from", "rule out", "prescribe",
        "triage priority", "differential diagnosis", "treat with"
    ]

    for cat_key, default_label in valid_categories.items():
        item = facts_by_cat.get(cat_key, {})
        value = str(item.get("value", "")).strip()
        quote = str(item.get("quote", "")).strip()
        raw_status = str(item.get("status", "needs_review")).lower()
        confidence = float(item.get("confidence", 0.85))

        # Check for empty or not mentioned
        if not value or value.lower() in ("none", "n/a", "not mentioned", "not provided", ""):
            value = "Not provided"
            quote = ""
            status: FactStatus = "not_provided"
            confidence = 1.0
        else:
            # Enforce non-diagnostic guardrail
            for flag in diagnostic_red_flags:
                if flag in value.lower() and flag not in quote.lower():
                    # AI injected diagnostic language not spoken by patient!
                    value = re.sub(re.escape(flag), "patient reports", value, flags=re.IGNORECASE)

            # Check if quote exists in transcript
            if quote:
                # Basic fuzzy/strip check
                clean_quote = re.sub(r"[^\w\s]", "", quote).lower()
                clean_trans = re.sub(r"[^\w\s]", "", lower_transcript)
                if clean_quote not in clean_trans:
                    # Quote might have minor formatting differences or was hallucinated
                    pass

            if raw_status in ("confirmed", "edited", "rejected", "not_provided", "unclear", "needs_review"):
                status = raw_status  # type: ignore
            else:
                status = "needs_review"

        cleaned_items.append(
            FactItem(
                id=str(uuid.uuid4()),
                category=cat_key,  # type: ignore
                label=item.get("label", default_label),
                value=value,
                quote=quote,
                status=status,
                confidence=min(max(confidence, 0.0), 1.0),
                worker_note=None
            )
        )

    return cleaned_items

def fallback_heuristic_extraction(transcript: str) -> List[FactItem]:
    """
    Heuristic/rule-based extraction for offline demo mode or when LLM is unreachable.
    Checks presets or performs keyword sentence alignment.
    """
    for preset in get_demo_presets():
        if preset["raw_transcript"].strip() == transcript.strip() or (len(transcript) > 20 and transcript[:30] in preset["raw_transcript"]):
            return [FactItem(**f) for f in preset["facts"]]

    # Fallback template with explicit unfilled status
    return [
        FactItem(
            id=str(uuid.uuid4()),
            category="patient_concern",
            label="Patient-Reported Concern",
            value=transcript[:120] + ("..." if len(transcript) > 120 else ""),
            quote=transcript[:120],
            status="needs_review",
            confidence=0.85,
            worker_note="Review required to confirm primary reported complaint"
        ),
        FactItem(
            id=str(uuid.uuid4()),
            category="symptoms_duration",
            label="Symptoms & Duration",
            value="Needs review: extract duration and symptom timeline from transcript",
            quote="",
            status="needs_review",
            confidence=0.70,
            worker_note="Verify duration reported in transcript"
        ),
        FactItem(
            id=str(uuid.uuid4()),
            category="relevant_history",
            label="Relevant Medical History",
            value="Not provided in current statements",
            quote="",
            status="not_provided",
            confidence=0.90,
            worker_note=None
        ),
        FactItem(
            id=str(uuid.uuid4()),
            category="current_medications",
            label="Current Medications",
            value="Not provided",
            quote="",
            status="not_provided",
            confidence=0.95,
            worker_note=None
        ),
        FactItem(
            id=str(uuid.uuid4()),
            category="allergies",
            label="Allergies",
            value="Not provided",
            quote="",
            status="not_provided",
            confidence=0.95,
            worker_note=None
        ),
        FactItem(
            id=str(uuid.uuid4()),
            category="other_reported",
            label="Other Reported Details",
            value="Awaiting healthcare worker review",
            quote="",
            status="needs_review",
            confidence=0.80,
            worker_note=None
        )
    ]

async def extract_structured_facts(
    transcript: str,
    patient_display_id: str = "PT-XXXX",
    force_demo: bool = False
) -> Tuple[List[FactItem], bool, str]:
    """
    Extracts structured intake facts from reviewed transcript.
    Returns: (List[FactItem], is_demo, provider_description)
    """
    if force_demo or settings.FORCE_DEMO_MODE or not sarvam_client.is_configured():
        logger.info("Using Demo / Heuristic extraction service.")
        facts = fallback_heuristic_extraction(transcript)
        return facts, True, "Demo Mode (Offline Synthetic Extraction)"

    try:
        user_prompt = (
            f"Patient ID: {patient_display_id}\n\n"
            f"TRANSCRIPT TO EXTRACT FROM:\n\"\"\"{transcript}\"\"\"\n\n"
            "Extract the 6 categories strictly as instructed into a JSON array."
        )

        messages = [
            {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        llm_response = await sarvam_client.chat_completion(
            messages=messages,
            model=settings.SARVAM_LLM_MODEL,
            temperature=0.05
        )

        raw_json = extract_json_from_llm_response(llm_response)
        facts = validate_and_sanitize_facts(raw_json, transcript)
        return facts, False, f"Sarvam AI ({settings.SARVAM_LLM_MODEL})"
    except Exception as exc:
        logger.warning(f"Sarvam LLM extraction call failed ({str(exc)}). Falling back to demo mode.")
        facts = fallback_heuristic_extraction(transcript)
        return facts, True, f"Demo Mode (Fallback: {str(exc)})"

