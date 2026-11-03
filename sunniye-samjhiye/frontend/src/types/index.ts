export type FactCategory =
  | 'patient_concern'
  | 'symptoms_duration'
  | 'relevant_history'
  | 'current_medications'
  | 'allergies'
  | 'other_reported';

export type FactStatus =
  | 'confirmed'
  | 'edited'
  | 'rejected'
  | 'not_provided'
  | 'unclear'
  | 'needs_review';

export interface FactItem {
  id: string;
  category: FactCategory;
  label: string;
  value: string;
  quote: string;
  status: FactStatus;
  confidence: number;
  worker_note?: string | null;
}

export type IntakeStatus = 'draft' | 'transcript_reviewed' | 'facts_reviewed' | 'approved' | 'archived';

export interface Intake {
  id: string;
  patient_display_id: string;
  status: IntakeStatus;
  created_at: string;
  updated_at: string;
  audio_filename?: string | null;
  audio_duration_seconds?: number | null;
  audio_stored: boolean;
  raw_transcript?: string | null;
  reviewed_transcript?: string | null;
  transcript_language?: string | null;
  facts: FactItem[];
  summary_draft?: string | null;
  summary_approved?: string | null;
  approved_by_worker?: string | null;
  approved_at?: string | null;
  worker_notes?: string | null;
  is_demo: boolean;
  provider: string;
  disclaimer: string;
}

export interface DemoPreset {
  id: string;
  title: string;
  patient_display_id: string;
  language_code: string;
  audio_description: string;
  raw_transcript: string;
  facts: FactItem[];
  summary: string;
}

export interface HealthStatus {
  status: string;
  project: string;
  version: string;
  sarvam_configured: boolean;
  demo_mode_active: boolean;
  model_stt: string;
  model_llm: string;
  model_tts: string;
  disclaimer: string;
}

