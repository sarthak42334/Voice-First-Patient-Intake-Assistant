import { Intake, FactItem, DemoPreset, HealthStatus } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch backend health');
  return res.json();
}

export async function fetchPresets(): Promise<DemoPreset[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to load demo presets');
  return res.json();
}

export async function listIntakes(): Promise<Intake[]> {
  const res = await fetch(`${API_BASE}/intakes`);
  if (!res.ok) throw new Error('Failed to fetch intakes list');
  return res.json();
}

export async function getIntake(id: string): Promise<Intake> {
  const res = await fetch(`${API_BASE}/intakes/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch intake ${id}`);
  return res.json();
}

export async function createIntake(data: {
  patient_display_id?: string;
  raw_transcript?: string;
  reviewed_transcript?: string;
  transcript_language?: string;
  is_demo?: boolean;
  provider?: string;
}): Promise<Intake> {
  const res = await fetch(`${API_BASE}/intakes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create intake');
  return res.json();
}

export async function updateIntake(
  id: string,
  data: {
    status?: string;
    reviewed_transcript?: string;
    extraction_data?: FactItem[];
    summary_draft?: string;
    summary_approved?: string;
    approved_by_worker?: string;
    worker_notes?: string;
  }
): Promise<Intake> {
  const res = await fetch(`${API_BASE}/intakes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update intake ${id}`);
  return res.json();
}

export async function deleteIntake(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/intakes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete intake ${id}`);
}

export async function transcribeAudio(
  audioBlob: Blob,
  filename: string = 'recording.webm',
  languageCode?: string,
  forceDemo: boolean = false
): Promise<{
  transcript: string;
  language_code: string;
  is_demo: boolean;
  provider: string;
  audio_stored: boolean;
  message?: string;
}> {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);
  if (languageCode) formData.append('language_code', languageCode);
  formData.append('force_demo', String(forceDemo));

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Audio transcription failed');
  }
  return res.json();
}

export async function extractFacts(
  transcript: string,
  patientDisplayId?: string,
  forceDemo: boolean = false
): Promise<{
  facts: FactItem[];
  is_demo: boolean;
  provider: string;
  disclaimer: string;
}> {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      patient_display_id: patientDisplayId,
      force_demo: forceDemo,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Fact extraction failed');
  }
  return res.json();
}

export async function summarizeIntake(
  transcript: string,
  facts: FactItem[],
  patientDisplayId?: string,
  forceDemo: boolean = false
): Promise<{
  summary: string;
  is_demo: boolean;
  provider: string;
  disclaimer: string;
}> {
  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      facts,
      patient_display_id: patientDisplayId,
      force_demo: forceDemo,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Summary generation failed');
  }
  return res.json();
}

export async function playTTS(
  text: string,
  languageCode: string = 'hi-IN',
  speaker: string = 'shubh',
  forceDemo: boolean = false
): Promise<{
  audio_base64?: string | null;
  is_demo: boolean;
  provider: string;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language_code: languageCode,
      speaker,
      force_demo: forceDemo,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Text-to-speech request failed');
  }
  return res.json();
}

export function getPdfExportUrl(intakeId: string): string {
  return `${API_BASE}/intakes/${intakeId}/pdf`;
}

