# 5-Minute Hackathon Demo Script: "Sunniye, Samjhiye" 🩺

**Presenters:** Healthcare Assistant Developer & Designer  
**Audience:** Hackathon Judges, Clinicians, Health-Tech Leaders  
**Duration:** Exactly 5 Minutes  
**Live URL:** `http://localhost:5173` (or `http://localhost:8000`)

---

## ⏱️ Minute 0:00 – 1:00 | The Hook & The Problem
> **Action:** Display the landing page with the persistent amber banner: *"This tool records and organizes reported information. It does not diagnose, recommend treatment, or replace a healthcare professional."*

**Speaker:**
> *"Namaste judges. In an overburdened Indian Outpatient Department (OPD) or rural Community Health Center, a healthcare worker sees upwards of 80 patients a day. Patients describe complex symptoms in Hindi, Hinglish, or regional dialects. 
> 
> Healthcare workers are forced to frantically type on computers instead of looking at the patient—or worse, critical reported symptoms like penicillin allergies or past medication reactions get lost in handwritten scribbles.
>
> Today, we introduce **“Sunniye, Samjhiye” (सुनिए, समझिए)**: a voice-first patient intake documentation assistant powered by Sarvam AI. 
>
> Let us be 100% clear: **This is NOT a diagnostic AI or triage bot.** It is a strict documentation assistant that listens, organizes what the patient reported, forces human verification, and creates an audit-ready medical intake record."*

---

## ⏱️ Minute 1:00 – 2:30 | Live Audio Capture & Indic Transcription
> **Action:** In the app, show Step 1. Point to Patient ID `PT-4102`.
> 
> *Option A (Live Mic):* Click Record and speak 2 sentences in Hindi:  
> *"मुझे चार दिनों से सूखी खांसी आ रही है और कल शाम से हल्का बुखार है। सीने में कोई भारीपन नहीं है, और मुझे कोई पुरानी बीमारी या एलर्जी नहीं है।"*  
> *Option B (Instant Demo Preset):* Click **"Demo Presets"** -> select **"Hindi / Hinglish: Acute Respiratory Complaint"**.

**Speaker:**
> *"Let's look at Step 1. The healthcare worker starts with an anonymous, non-identifying patient ID to safeguard privacy. 
> 
> Notice this green badge: **Ephemeral Audio**. We do not retain patient voice recordings on disk; audio is processed in-memory.
>
> Next, **Sarvam Saaras v4** transcribes the speech. Notice the output in Step 2: it accurately transcribed mixed Hindi/Hinglish speech. 
> 
> Before any AI extraction happens, the healthcare worker has the full power to correct or edit any misheard word right here in the transcript editor. Worker edits become the ground truth."*

---

## ⏱️ Minute 2:30 – 3:45 | Fact Extraction with Quotes & Guardrails
> **Action:** Click **"Extract Structured Facts"**. Show the 6 generated fact cards.

**Speaker:**
> *"Now we call **Sarvam-105B** with our strict clinical guardrails. 
>
> Look closely at the screen:
> 1. It organized the intake into 6 standard categories: Chief Concern, Symptoms & Duration, History, Medications, Allergies, and Other Details.
> 2. **Every single fact has an exact, verbatim quotation from the patient.** There are zero hallucinations.
> 3. Notice the status pills: the worker can confirm, edit, or reject each item.
> 4. If a patient did not mention allergies, the system **never guesses**—it explicitly labels it **'Not provided'**.
> 5. If a patient mentions an unknown pill—as seen in our third demo preset—the system automatically tags it **'Needs review'** and alerts the worker to inspect the prescription."*

---

## ⏱️ Minute 3:45 – 4:30 | Summary, Bulbul Voice Playback & Sign-Off
> **Action:** Click **"Draft Intake Summary"**. 
> - Click **"Listen Aloud (Sarvam Bulbul)"** to play the audio.
> - Check the worker attestation box.
> - Click **"Confirm & Save Intake"** -> Confirm modal appears -> Click **"Yes, Approve & Save"**.

**Speaker:**
> *"In Step 4, Sarvam-105B drafts a concise, factual intake summary that explicitly preserves uncertainty.
>
> For illiterate or visually impaired patients, or for quick audio verification, we integrate **Sarvam Bulbul v3** to read the approved summary aloud. *(Let the audio play for 3 seconds)*
>
> Notice the mandatory sign-off: the healthcare worker enters their name, adds clinical notes, and checks the attestation checkbox:
> *'I confirm this represents reported statements only and contains no clinical diagnosis.'*
>
> The confirmation modal prevents accidental submissions."*

---

## ⏱️ Minute 4:30 – 5:00 | Persistence, PDF Export & Conclusion
> **Action:** Click **"Export PDF Report"**. The PDF opens in a new tab displaying the formatted report with headers, patient quote tables, and safety disclaimers. 
> Switch to **"Saved Intakes Archive"** to show the SQLite dashboard.

**Speaker:**
> *"With one click, the system generates this professional, publication-quality medical intake PDF report via our ReportLab engine. It is timestamped, signed off by the nurse, and ready to hand to the evaluating doctor.
>
> In the **Saved Intakes Archive**, every intake is securely stored in local SQLite with full review tracking.
>
> In summary, **Sunniye, Samjhiye** gives precious time back to frontline healthcare workers, eliminates scribing burnout, and bridges the language divide across India—safely, reliably, and ethically.
>
> Thank you, and we welcome your questions!"*

