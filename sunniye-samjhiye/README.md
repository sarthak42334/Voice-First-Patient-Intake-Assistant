# Sunniye, Samjhiye (सुनिए, समझिए) 🩺
**A Voice-First Patient Intake Assistant for Healthcare Workers**

> **Mandatory Clinical Notice:**
> *"This tool records and organizes reported information. It does not diagnose, recommend treatment, or replace a healthcare professional."*

---

## 📌 Executive Summary

**Sunniye, Samjhiye** ("Listen, Understand") is an open, human-in-the-loop clinical documentation intake assistant tailored for primary healthcare workers, nurses, community health workers (ASHA/ANM), and outpatient triage desks. 

Instead of typing on clumsy keyboards during busy clinical shifts, the healthcare worker simply records or uploads the patient's spoken statements (in Hindi, Indian English, or regional Indic languages). Powered by **Sarvam AI**, the system:
1. **Transcribes** audio into accurate verbatim text using **Sarvam Saaras** (`saaras:v4`).
2. **Allows worker review and correction** of misheard terms.
3. **Extracts structured facts** backed by **verbatim quotes** using **Sarvam-105B**.
4. **Enforces non-diagnostic guardrails** (strictly documents reported complaints, flags ambiguities as *"Needs review"* or *"Not provided"*, and forbids hallucinated diagnoses or medical advice).
5. **Generates an intake summary** preserving reported uncertainties.
6. **Reads the approved summary aloud** using **Sarvam Bulbul** (`bulbul:v3`).
7. **Saves records to SQLite** and exports a formal **Intake PDF Report**.

---

## 🏗️ Architecture & Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │               Frontend (React 19 + Vite + Tailwind CSS)      │
   │  • Browser Mic Recorder (MediaRecorder WebM/WAV)            │
   │  • Transcript Editor & Word/Language Statistics             │
   │  • Interactive Fact Verification Cards with Quotes & Status  │
   │  • Worker Sign-off, Attestation Checkbox & PDF Exporter     │
   │  • 1-Click Demo Preset Selector for Immediate Evaluation    │
   └───────────────┬─────────────────────────────▲───────────────┘
                   │ /api/*                      │
   ┌───────────────▼─────────────────────────────┴───────────────┐
   │                  Backend (Python 3.12 + FastAPI)             │
   │  • SQLite ORM Database (SQLAlchemy)                         │
   │  • Strict Non-Diagnostic Guardrails & Sanitizers            │
   │  • ReportLab Medical Intake PDF Engine                      │
   └───────────────┬─────────────────────────────────────────────┘
                   │
   ┌───────────────▼─────────────────────────────────────────────┐
   │                     Sarvam AI Cloud APIs                    │
   │  • Saaras v4 (`/speech-to-text`): Indic Speech Recognition   │
   │  • Sarvam-105B (`/v1/chat/completions`): Fact Extraction    │
   │  • Bulbul v3 (`/text-to-speech`): Summary Voice Playback    │
   │  • Fallback Engine: Offline Synthetic Clinical Presets      │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (tested on Python 3.12)
- **Node.js 18+** & `npm`
- *(Optional)* A Sarvam AI subscription key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai). (The system runs automatically in **Demo Mode** if no key is provided!)

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and configure your SARVAM_API_KEY
cp .env.example .env
```

To configure your API key, edit `backend/.env`:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_BASE_URL=https://api.sarvam.ai
SARVAM_STT_MODEL=saaras:v4
SARVAM_LLM_MODEL=sarvam-105b
SARVAM_TTS_MODEL=bulbul:v3
DEMO_MODE=false
DATABASE_URL=sqlite:///./sunniye_samjhiye.db
STORE_AUDIO_FILES=false
```

Start the FastAPI server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/api/docs`

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

Visit the app in your browser at: **`http://localhost:5173`**

*(Note: The Vite dev server automatically proxies `/api` requests to `http://localhost:8000`)*

---

### 4. Running Unified Full-Stack (Single Port)

FastAPI is configured to serve the pre-built React SPA directly when compiled:
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Start backend
cd ../backend
python -m uvicorn app.main:app --port 8000
```
Open **`http://localhost:8000`** in any browser to access the complete application!

---

## 🧪 Testing & Verification

The backend includes a comprehensive pytest suite covering API endpoints, SQLite persistence, non-diagnostic guardrails, quote validation, and PDF generation.

```bash
cd backend
python -m pytest tests/ -v
```

### Test Suite Summary:
- `test_health.py`: Validates health status, project metadata, and persistent clinical disclaimer.
- `test_intakes.py`: Validates CRUD lifecycle, auto-generation of anonymous patient IDs (`PT-XXXX`), updates, and deletions.
- `test_guardrails.py`: 
  - Verifies that missing items are strictly tagged `"Not provided"`.
  - Verifies that model attempts to inject diagnostic conclusions (e.g. *"diagnosed with"*, *"treat with"*) are sanitized and stripped.
  - Verifies that all generated summaries append the mandatory non-diagnostic disclaimer.
- `test_export_pdf.py`: Validates that the ReportLab PDF engine compiles valid binary documents (`%PDF-`) with headers, tables, and footers.
- `test_sarvam_service.py`: Validates Sarvam client configuration, timeout isolation, and graceful fallback to offline demo mode.

---

## 🛡️ Safety, Guardrails & Privacy

1. **Non-Diagnostic Mandate:**
   - The system is architected as an **intake and documentation tool only**. It explicitly refuses to produce diagnoses, triage priority scores, or medication prescriptions.
2. **Strict Verbatim Quotes:**
   - Every structured fact card surfaces the exact quotation from the transcript. If the patient did not say it, it is labeled **"Not provided"** with an empty quote.
3. **Handling Ambiguity:**
   - Vague statements (e.g., *"I took an unnamed blue pill"*) are proactively flagged as **"Needs Review"** or **"Unclear"**, ensuring healthcare workers clarify the item.
4. **Ephemeral Audio Processing:**
   - By default (`STORE_AUDIO_FILES=false`), recorded or uploaded audio is processed purely in memory and is **not written to permanent disk**, safeguarding patient privacy.
5. **Non-Identifying IDs:**
   - Intake IDs default to pseudonymous codes like `PT-4102`, preventing unnecessary demographic exposure in demo environments.

---

## 🎯 1-Click Synthetic Demo Presets (For Judges)

Click the **"Demo Presets"** button in the top navigation to test the application instantly without recording:
- **Preset 1 (Hindi / Hinglish):** Patient with 4 days of dry cough and mild fever; denies chest heaviness; home herbal kadha only.
- **Preset 2 (English / Hinglish):** Patient reporting bathroom slip with swollen knee; hypertension on Amlodipine; penicillin allergy.
- **Preset 3 (Unclear / Ambiguous):** Patient with fluctuating stomach pain and an unidentified pill; demonstrates automatic `"Needs review"` and `"Not provided"` labeling.

---

## 📑 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, Sarvam connectivity status, and disclaimer |
| `GET` | `/api/presets` | Synthetic patient intake presets for instant demonstration |
| `POST` | `/api/transcribe` | Transcribes audio using Sarvam Saaras (`saaras:v4`) |
| `POST` | `/api/extract` | Extracts 6 structured categories with quotes via Sarvam-105B |
| `POST` | `/api/summarize` | Generates structured draft intake summary |
| `POST` | `/api/tts` | Converts approved summary to speech via Sarvam Bulbul (`bulbul:v3`) |
| `GET` | `/api/intakes` | Lists all saved intakes in SQLite |
| `POST` | `/api/intakes` | Creates a new intake record |
| `GET` | `/api/intakes/{id}` | Retrieves full intake record with review history |
| `PATCH` | `/api/intakes/{id}` | Updates status, transcript, facts, worker notes, or approval |
| `DELETE` | `/api/intakes/{id}` | Deletes intake record |
| `GET` | `/api/intakes/{id}/pdf` | Generates and downloads formatted intake PDF document |

---

## 🔮 Future Work & Roadmap

- **Sarvam Vision Document Ingestion:** Direct camera capture of paper prescription slips and laboratory reports to automatically link prescription names to patient statements.
- **Offline Edge Sync:** PWA offline caching for primary health centers in remote rural areas with intermittent connectivity.
- **EHR / FHIR Export:** Direct export to ABDM (Ayushman Bharat Digital Mission) FHIR bundles for interoperable record sharing.

