"""
Demo service providing realistic synthetic intake datasets for offline/fallback mode.
Preserves patient uncertainty, avoids hallucinating facts, and marks missing items clearly.
"""

import uuid
from typing import List, Dict, Any
from ..schemas import FactItem

DEMO_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "preset_cough_fever",
        "title": "Hindi / Hinglish: Acute Respiratory Complaint",
        "patient_display_id": "PT-4102",
        "language_code": "hi-IN",
        "audio_description": "Patient describing 4 days of dry cough and mild evening fever",
        "raw_transcript": (
            "नमस्ते, मुझे पिछले चार दिनों से बहुत तेज सूखी खांसी आ रही है और कल शाम से हल्का बुखार भी महसूस हो रहा है। "
            "सीने में कोई भारीपन या सांस फूलने की दिक्कत तो नहीं है। मुझे कोई पुरानी बीमारी जैसे डायबिटीज या बीपी नहीं है। "
            "फिलहाल कोई अंग्रेजी दवा नहीं ले रहा हूँ, बस घर का काढ़ा पिया था। मुझे किसी भी दवा से कोई एलर्जी नहीं है।"
        ),
        "facts": [
            {
                "id": str(uuid.uuid4()),
                "category": "patient_concern",
                "label": "Patient-Reported Concern",
                "value": "सूखी खांसी और हल्का बुखार (Persistent dry cough and mild fever)",
                "quote": "मुझे पिछले चार दिनों से बहुत तेज सूखी खांसी आ रही है और कल शाम से हल्का बुखार भी महसूस हो रहा है।",
                "status": "confirmed",
                "confidence": 0.98,
                "worker_note": "Explicitly reported onset"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "symptoms_duration",
                "label": "Symptoms & Duration",
                "value": "Dry cough for 4 days; mild fever since previous evening; denies chest heaviness or breathlessness",
                "quote": "पिछले चार दिनों से बहुत तेज सूखी खांसी... कल शाम से हल्का बुखार... सीने में कोई भारीपन या सांस फूलने की दिक्कत तो नहीं है।",
                "status": "confirmed",
                "confidence": 0.96,
                "worker_note": "Negative symptoms explicitly mentioned by patient"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "relevant_history",
                "label": "Relevant Medical History",
                "value": "Denies prior chronic illnesses (specifically mentions no diabetes, no hypertension)",
                "quote": "मुझे कोई पुरानी बीमारी जैसे डायबिटीज या बीपी नहीं है।",
                "status": "confirmed",
                "confidence": 0.95,
                "worker_note": "Patient denies chronic history"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "current_medications",
                "label": "Current Medications",
                "value": "No allopathic medications reported; reports drinking home herbal concoction (kadha) only",
                "quote": "फिलहाल कोई अंग्रेजी दवा नहीं ले रहा हूँ, बस घर का काढ़ा पिया था।",
                "status": "confirmed",
                "confidence": 0.94,
                "worker_note": "Home remedy only, no prescription drugs"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "allergies",
                "label": "Allergies",
                "value": "Denies known drug allergies",
                "quote": "मुझे किसी भी दवा से कोई एलर्जी नहीं है।",
                "status": "confirmed",
                "confidence": 0.99,
                "worker_note": "Explicitly reported no known allergies"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "other_reported",
                "label": "Other Reported Details",
                "value": "Reports normal breathing; denies shortness of breath or chest heaviness",
                "quote": "सीने में कोई भारीपन या सांस फूलने की दिक्कत तो नहीं है।",
                "status": "confirmed",
                "confidence": 0.92,
                "worker_note": "Denies chest pain"
            }
        ],
        "summary": (
            "PATIENT-REPORTED INTAKE SUMMARY (PT-4102)\n"
            "• Reported Chief Concern: Persistent dry cough and subjective fever.\n"
            "• Timeline & Symptoms: Cough onset approximately 4 days ago; mild fever noted since yesterday evening. "
            "Patient explicitly reports no chest heaviness and no shortness of breath.\n"
            "• Medical History: Patient states no known history of hypertension or diabetes.\n"
            "• Medications: Denies taking conventional/allopathic medications; reports drinking home herbal kadha.\n"
            "• Allergies: Denies known drug allergies.\n"
            "• Ambiguities/Unclear: None noted; all statements explicitly quoted.\n"
            "\n[Notice: Intake documentation only. Non-diagnostic. Awaiting clinician evaluation.]"
        )
    },
    {
        "id": "preset_knee_fall",
        "title": "English / Hinglish: Post-Fall Knee Pain & Swelling",
        "patient_display_id": "PT-7824",
        "language_code": "en-IN",
        "audio_description": "Patient reporting bathroom slip 2 days ago with knee swelling and penicillin allergy",
        "raw_transcript": (
            "I slipped and fell in the bathroom two days ago, and my left knee has been swollen and painful since then. "
            "I can walk slowly around the room, but climbing stairs is very painful. "
            "I have a history of high blood pressure for the last 5 years and I take Amlodipine 5mg once daily every morning. "
            "I am allergic to Penicillin, which gave me full-body skin rashes 3 years ago. No fever, and no other injuries."
        ),
        "facts": [
            {
                "id": str(uuid.uuid4()),
                "category": "patient_concern",
                "label": "Patient-Reported Concern",
                "value": "Left knee pain and swelling following a slip and fall",
                "quote": "I slipped and fell in the bathroom two days ago, and my left knee has been swollen and painful since then.",
                "status": "confirmed",
                "confidence": 0.99,
                "worker_note": "Traumatic onset reported"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "symptoms_duration",
                "label": "Symptoms & Duration",
                "value": "Left knee pain and swelling for 2 days; exacerbated by stair climbing; able to walk slowly; denies other injuries or fever",
                "quote": "two days ago, and my left knee has been swollen and painful... walk slowly around the room, but climbing stairs is very painful... No fever, and no other injuries.",
                "status": "confirmed",
                "confidence": 0.97,
                "worker_note": "Functional limitation: stair climbing"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "relevant_history",
                "label": "Relevant Medical History",
                "value": "Hypertension for 5 years",
                "quote": "I have a history of high blood pressure for the last 5 years",
                "status": "confirmed",
                "confidence": 0.98,
                "worker_note": "Longstanding hypertension"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "current_medications",
                "label": "Current Medications",
                "value": "Amlodipine 5mg orally once daily in the morning",
                "quote": "I take Amlodipine 5mg once daily every morning.",
                "status": "confirmed",
                "confidence": 0.99,
                "worker_note": "Dosage and frequency specified"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "allergies",
                "label": "Allergies",
                "value": "Penicillin (patient reports full-body rash reaction 3 years ago)",
                "quote": "I am allergic to Penicillin, which gave me full-body skin rashes 3 years ago.",
                "status": "confirmed",
                "confidence": 0.99,
                "worker_note": "Severe rash reaction reported"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "other_reported",
                "label": "Other Reported Details",
                "value": "Mechanism of injury: slip and fall in the bathroom; denies fever or other trauma",
                "quote": "I slipped and fell in the bathroom two days ago... No fever, and no other injuries.",
                "status": "confirmed",
                "confidence": 0.95,
                "worker_note": "Isolated left knee trauma reported"
            }
        ],
        "summary": (
            "PATIENT-REPORTED INTAKE SUMMARY (PT-7824)\n"
            "• Reported Chief Concern: Left knee swelling and localized pain.\n"
            "• Mechanism & Duration: Patient slipped and fell in bathroom 2 days ago. Reports pain aggravated by climbing stairs; can ambulate slowly.\n"
            "• Medical History: High blood pressure for 5 years.\n"
            "• Medications: Amlodipine 5mg once daily in the morning.\n"
            "• Allergies: Penicillin (history of full-body rash).\n"
            "• Reported Negatives: Patient denies fever and denies other injuries.\n"
            "\n[Notice: Intake documentation only. Non-diagnostic. Awaiting clinician evaluation.]"
        )
    },
    {
        "id": "preset_unclear_abdominal",
        "title": "Hindi: Abdominal Discomfort with Ambiguities (Testing Gaps & Review Flags)",
        "patient_display_id": "PT-9133",
        "language_code": "hi-IN",
        "audio_description": "Vague abdominal pain with unnamed past pills, demonstrating 'Needs review' and 'Not provided'",
        "raw_transcript": (
            "मुझे पेट में कभी-कभी अजीब सा दर्द उठता है, कभी नाभि के पास कभी नीचे। कुछ दिनों से ठीक से खाना भी नहीं खा पा रहा। "
            "कल रात एक नीले रंग की गोली खाई थी पर नाम याद नहीं आ रहा। बाकी किसी बीमारी या एलर्जी का मुझे पता नहीं है।"
        ),
        "facts": [
            {
                "id": str(uuid.uuid4()),
                "category": "patient_concern",
                "label": "Patient-Reported Concern",
                "value": "अस्पष्ट पेट दर्द (Intermittent vague abdominal discomfort)",
                "quote": "मुझे पेट में कभी-कभी अजीब सा दर्द उठता है, कभी नाभि के पास कभी नीचे।",
                "status": "needs_review",
                "confidence": 0.82,
                "worker_note": "Location and nature of pain are fluctuating"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "symptoms_duration",
                "label": "Symptoms & Duration",
                "value": "Unclear duration ('कुछ दिनों से' / a few days); decreased appetite; fluctuating periumbilical and lower abdominal discomfort",
                "quote": "कुछ दिनों से ठीक से खाना भी नहीं खा पा रहा।",
                "status": "unclear",
                "confidence": 0.75,
                "worker_note": "Exact duration in days not specified by patient"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "relevant_history",
                "label": "Relevant Medical History",
                "value": "Not provided (patient states they are unaware of existing conditions)",
                "quote": "बाकी किसी बीमारी या एलर्जी का मुझे पता नहीं है।",
                "status": "not_provided",
                "confidence": 0.90,
                "worker_note": "No medical records or confirmed diagnoses reported"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "current_medications",
                "label": "Current Medications",
                "value": "Unclear / Needs review: Patient reports taking an unidentified 'blue pill' last night; name and dosage unknown",
                "quote": "कल रात एक नीले रंग की गोली खाई थी पर नाम याद नहीं आ रहा।",
                "status": "needs_review",
                "confidence": 0.85,
                "worker_note": "Crucial: Healthcare worker must verify medication wrapper or prescription"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "allergies",
                "label": "Allergies",
                "value": "Not provided / Unknown to patient",
                "quote": "बाकी किसी बीमारी या एलर्जी का मुझे पता नहीं है।",
                "status": "not_provided",
                "confidence": 0.92,
                "worker_note": "Allergy status unknown, needs formal clinician verification"
            },
            {
                "id": str(uuid.uuid4()),
                "category": "other_reported",
                "label": "Other Reported Details",
                "value": "Decreased food intake for a few days",
                "quote": "कुछ दिनों से ठीक से खाना भी नहीं खा पा रहा।",
                "status": "confirmed",
                "confidence": 0.88,
                "worker_note": "Reported poor oral intake"
            }
        ],
        "summary": (
            "PATIENT-REPORTED INTAKE SUMMARY (PT-9133)\n"
            "• Reported Chief Concern: Intermittent abdominal discomfort (vague location around navel and lower abdomen).\n"
            "• Timeline & Symptoms: Fluctuating discomfort and poor oral intake for an unspecified period ('a few days').\n"
            "• Medical History: NOT PROVIDED / UNKNOWN (patient is unaware of any past diagnoses).\n"
            "• Medications: UNIDENTIFIED MEDICATION (patient reported taking one 'blue-colored pill' last night; name, strength, and indication are unknown. NEEDS CLINICIAN REVIEW).\n"
            "• Allergies: NOT PROVIDED / UNKNOWN (patient reports no knowledge of allergy status).\n"
            "• Clarifications Needed: Clarify onset date, inspect medication blister if brought, clarify bowel habits.\n"
            "\n[Notice: Intake documentation only. Non-diagnostic. Preserves all reported uncertainties.]"
        )
    }
]

def get_demo_presets() -> List[Dict[str, Any]]:
    return DEMO_PRESETS

def get_demo_preset_by_id(preset_id: str) -> Dict[str, Any]:
    for p in DEMO_PRESETS:
        if p["id"] == preset_id:
            return p
    return DEMO_PRESETS[0]

