import logging
from typing import List, Tuple
from ..schemas import FactItem
from ..config import settings
from .sarvam_service import sarvam_client
from .demo_service import get_demo_presets

logger = logging.getLogger("summary_service")

SUMMARY_SYSTEM_PROMPT = """You are a strictly factual Patient Intake Documentation Assistant for "Sunniye, Samjhiye".
Your role is to write a concise, organized intake summary of information reported by the patient.

NON-DIAGNOSTIC & SAFEGUARD RULES:
1. YOU ARE NOT A DOCTOR. YOU DO NOT DIAGNOSE OR SUGGEST TREATMENT.
2. DO NOT infer diseases, conditions, differential diagnoses, or risk scores.
3. PRESERVE ALL UNCERTAINTIES. If the patient reported an unknown pill or vague timeline, explicitly write "Unclear - requires clinician clarification".
4. If an item was marked "Not provided", state "Not reported by patient".
5. DO NOT ADD ANY INFORMATION not found in the verified facts or transcript.
6. Format clearly with bullet points.
7. Always end with the mandatory notice:
   "DISCLAIMER: Documentation and intake tool only. Does not diagnose, recommend treatment, or replace clinical evaluation by a licensed healthcare professional."
"""

def generate_offline_summary(patient_display_id: str, facts: List[FactItem], transcript: str) -> str:
    # Check if matches any demo preset
    for preset in get_demo_presets():
        if preset["patient_display_id"] == patient_display_id:
            return preset["summary"]

    # Factual template synthesis
    summary_lines = [
        f"PATIENT-REPORTED INTAKE SUMMARY ({patient_display_id})",
        "--------------------------------------------------",
        "1. Patient-Reported Concern:"
    ]

    fact_map = {f.category: f for f in facts}

    concern = fact_map.get("patient_concern")
    if concern and concern.status != "not_provided":
        summary_lines.append(f"   • {concern.value}")
        if concern.quote:
            summary_lines.append(f"     [Quote: \"{concern.quote}\"]")
    else:
        summary_lines.append("   • Not provided by patient.")

    symptoms = fact_map.get("symptoms_duration")
    summary_lines.append("\n2. Symptoms & Reported Timeline:")
    if symptoms and symptoms.status != "not_provided":
        summary_lines.append(f"   • {symptoms.value}")
    else:
        summary_lines.append("   • Timeline not specified.")

    history = fact_map.get("relevant_history")
    summary_lines.append("\n3. Medical History:")
    if history and history.status != "not_provided":
        summary_lines.append(f"   • {history.value}")
    else:
        summary_lines.append("   • No prior conditions reported.")

    meds = fact_map.get("current_medications")
    summary_lines.append("\n4. Current Medications:")
    if meds and meds.status != "not_provided":
        summary_lines.append(f"   • {meds.value}")
        if meds.status in ("needs_review", "unclear"):
            summary_lines.append("     * ATTENTION: Verification required by clinician.")
    else:
        summary_lines.append("   • None reported.")

    allergies = fact_map.get("allergies")
    summary_lines.append("\n5. Known Allergies:")
    if allergies and allergies.status != "not_provided":
        summary_lines.append(f"   • {allergies.value}")
    else:
        summary_lines.append("   • None reported.")

    other = fact_map.get("other_reported")
    if other and other.status != "not_provided":
        summary_lines.append(f"\n6. Additional Patient Remarks:\n   • {other.value}")

    # Unclear or needs review highlights
    unclear_items = [f for f in facts if f.status in ("unclear", "needs_review")]
    if unclear_items:
        summary_lines.append("\n7. Items Flagged for Healthcare Worker Clarification:")
        for ui in unclear_items:
            summary_lines.append(f"   • {ui.label}: {ui.value}")

    summary_lines.append(f"\n\nNOTICE: {settings.PERSISTENT_DISCLAIMER}")
    return "\n".join(summary_lines)

async def generate_intake_summary(
    patient_display_id: str,
    facts: List[FactItem],
    transcript: str,
    force_demo: bool = False
) -> Tuple[str, bool, str]:
    """
    Generates draft summary based on confirmed facts and transcript.
    Returns: (summary_text, is_demo, provider)
    """
    if force_demo or settings.FORCE_DEMO_MODE or not sarvam_client.is_configured():
        logger.info("Using offline template summary generator.")
        summary = generate_offline_summary(patient_display_id, facts, transcript)
        return summary, True, "Demo Mode (Offline Factual Summary)"

    try:
        facts_summary = "\n".join([
            f"- {f.label} ({f.category}): {f.value} [Status: {f.status}] [Quote: \"{f.quote}\"]"
            for f in facts
        ])

        user_prompt = (
            f"Patient ID: {patient_display_id}\n\n"
            f"VERIFIED INTAKE FACTS:\n{facts_summary}\n\n"
            f"ORIGINAL TRANSCRIPT:\n\"\"\"{transcript}\"\"\"\n\n"
            "Generate a structured, professional intake summary following the safety and non-diagnostic instructions."
        )

        messages = [
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        llm_response = await sarvam_client.chat_completion(
            messages=messages,
            model=settings.SARVAM_LLM_MODEL,
            temperature=0.1
        )

        # Make sure the disclaimer is explicitly present
        if settings.PERSISTENT_DISCLAIMER not in llm_response:
            llm_response += f"\n\n[NOTICE: {settings.PERSISTENT_DISCLAIMER}]"

        return llm_response, False, f"Sarvam AI ({settings.SARVAM_LLM_MODEL})"
    except Exception as exc:
        logger.warning(f"Sarvam LLM summary failed ({str(exc)}). Using offline fallback.")
        summary = generate_offline_summary(patient_display_id, facts, transcript)
        return summary, True, f"Demo Mode (Fallback: {str(exc)})"

