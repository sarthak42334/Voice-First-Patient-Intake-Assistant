import React, { useState, useEffect } from 'react';
import { SafetyBanner } from './components/SafetyBanner';
import { Header } from './components/Header';
import { AudioCapture } from './components/AudioCapture';
import { TranscriptReview } from './components/TranscriptReview';
import { FactsReviewPanel } from './components/FactsReviewPanel';
import { SummaryApproval } from './components/SummaryApproval';
import { IntakeDashboard } from './components/IntakeDashboard';
import { IntakeDetailModal } from './components/IntakeDetailModal';
import { DemoPresetModal } from './components/DemoPresetModal';
import {
  HealthStatus,
  DemoPreset,
  Intake,
  FactItem
} from './types';
import {
  fetchHealth,
  fetchPresets,
  listIntakes,
  createIntake,
  updateIntake,
  extractFacts,
  summarizeIntake
} from './api/client';
import { Check, ChevronRight, Mic, FileText, CheckCircle2, FileCheck2 } from 'lucide-react';

export function App() {
  // Global Engine & Preset State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [demoModeOverride, setDemoModeOverride] = useState<boolean>(false);
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState<'intake' | 'dashboard' | 'presets'>('intake');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Saved Intakes Archive
  const [intakesList, setIntakesList] = useState<Intake[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);

  // Current Intake Active State
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [patientDisplayId, setPatientDisplayId] = useState<string>('PT-4102');
  const [languageCode, setLanguageCode] = useState<string>('hi-IN');
  const [sttProvider, setSttProvider] = useState<string>('Sarvam AI');
  const [isSttDemo, setIsSttDemo] = useState<boolean>(false);

  // Workflow Data
  const [transcript, setTranscript] = useState<string>('');
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [facts, setFacts] = useState<FactItem[]>([]);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Load initial backend health and presets
  const loadInitialData = async () => {
    try {
      const h = await fetchHealth();
      setHealth(h);
      if (h.demo_mode_active) {
        setDemoModeOverride(true);
      }
    } catch (err) {
      console.warn('Backend offline or health unreachable:', err);
    }

    try {
      const p = await fetchPresets();
      setPresets(p);
    } catch (err) {
      console.warn('Could not load presets:', err);
    }

    try {
      const list = await listIntakes();
      setIntakesList(list);
    } catch (err) {
      console.warn('Could not load intakes list:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshIntakesList = async () => {
    try {
      const list = await listIntakes();
      setIntakesList(list);
    } catch (err) {
      console.error('Failed to refresh intakes:', err);
    }
  };

  // Reset workflow to new intake
  const handleStartNewIntake = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setIntakeId(null);
    setPatientDisplayId(`PT-${randomNum}`);
    setTranscript('');
    setRawTranscript('');
    setFacts([]);
    setSummary('');
    setIsApproved(false);
    setCurrentStep(1);
    setActiveTab('intake');
  };

  // Handle Preset Selection (1-click judge evaluation)
  const handleSelectPreset = (preset: DemoPreset) => {
    setIntakeId(null);
    setPatientDisplayId(preset.patient_display_id);
    setLanguageCode(preset.language_code);
    setTranscript(preset.raw_transcript);
    setRawTranscript(preset.raw_transcript);
    setFacts(preset.facts);
    setSummary(preset.summary);
    setSttProvider('Demo Preset (Synthetic)');
    setIsSttDemo(true);
    setIsApproved(false);
    setCurrentStep(3); // Jump right to fact review
    setActiveTab('intake');
  };

  // Step 1: Transcription Complete
  const handleTranscriptionComplete = (
    trans: string,
    lang: string,
    demo: boolean,
    provider: string
  ) => {
    setTranscript(trans);
    setRawTranscript(trans);
    setLanguageCode(lang);
    setIsSttDemo(demo);
    setSttProvider(provider);
    setCurrentStep(2); // Advance to Transcript Review
  };

  // Step 2: Extract Facts
  const handleExtractFacts = async () => {
    if (!transcript.trim()) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await extractFacts(transcript, patientDisplayId, demoModeOverride);
      setFacts(res.facts);
      setCurrentStep(3); // Advance to Fact Review
    } catch (err: any) {
      setExtractError(err.message || 'Fact extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 3: Generate Summary
  const handleGenerateSummary = async () => {
    if (facts.length === 0) return;
    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await summarizeIntake(transcript, facts, patientDisplayId, demoModeOverride);
      setSummary(res.summary);
      setCurrentStep(4); // Advance to Final Summary Approval
    } catch (err: any) {
      setSummaryError(err.message || 'Summary generation failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Step 4: Approve & Save to SQLite
  const handleApproveAndSave = async (workerName: string, notes: string) => {
    setIsSaving(true);
    try {
      if (!intakeId) {
        // Create new intake record
        const newRecord = await createIntake({
          patient_display_id: patientDisplayId,
          raw_transcript: rawTranscript || transcript,
          reviewed_transcript: transcript,
          transcript_language: languageCode,
          is_demo: demoModeOverride || isSttDemo,
          provider: sttProvider,
        });

        // Immediately update with approved data
        const updated = await updateIntake(newRecord.id, {
          status: 'approved',
          extraction_data: facts,
          summary_approved: summary,
          summary_draft: summary,
          approved_by_worker: workerName,
          worker_notes: notes,
        });

        setIntakeId(updated.id);
        setIsApproved(true);
      } else {
        // Update existing intake
        const updated = await updateIntake(intakeId, {
          status: 'approved',
          reviewed_transcript: transcript,
          extraction_data: facts,
          summary_approved: summary,
          approved_by_worker: workerName,
          worker_notes: notes,
        });
        setIsApproved(true);
      }
      await refreshIntakesList();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Re-open saved intake in workflow
  const handleReopenInWorkflow = (intake: Intake) => {
    setSelectedIntake(null);
    setIntakeId(intake.id);
    setPatientDisplayId(intake.patient_display_id);
    setTranscript(intake.reviewed_transcript || intake.raw_transcript || '');
    setRawTranscript(intake.raw_transcript || '');
    setFacts(intake.facts || []);
    setSummary(intake.summary_approved || intake.summary_draft || '');
    setLanguageCode(intake.transcript_language || 'hi-IN');
    setIsApproved(intake.status === 'approved');
    setCurrentStep(intake.summary_approved ? 4 : intake.facts?.length ? 3 : 2);
    setActiveTab('intake');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Mandatory Persistent Safety Banner */}
      <SafetyBanner />

      {/* 2. Application Header */}
      <Header
        health={health}
        demoModeOverride={demoModeOverride}
        onToggleDemoMode={() => setDemoModeOverride(!demoModeOverride)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      {/* 3. Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'intake' && (
          <div>
            {/* Step Progress Stepper */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 mb-6 shadow-xs flex items-center justify-between overflow-x-auto text-xs">
              {[
                { step: 1, label: '1. Audio Capture', icon: Mic },
                { step: 2, label: '2. Review Transcript', icon: FileText },
                { step: 3, label: '3. Extracted Facts', icon: CheckCircle2 },
                { step: 4, label: '4. Summary & Approval', icon: FileCheck2 },
              ].map(({ step, label, icon: Icon }) => {
                const isActive = currentStep === step;
                const isPassed = currentStep > step;

                return (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border border-teal-300'
                        : isPassed
                        ? 'text-emerald-700 hover:bg-slate-50'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : step}
                    </div>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Workflow Step Panels */}
            {currentStep === 1 && (
              <AudioCapture
                patientDisplayId={patientDisplayId}
                setPatientDisplayId={setPatientDisplayId}
                onTranscriptionComplete={handleTranscriptionComplete}
                forceDemo={demoModeOverride}
                onOpenPresets={() => setIsPresetsOpen(true)}
              />
            )}

            {currentStep === 2 && (
              <TranscriptReview
                transcript={transcript}
                setTranscript={setTranscript}
                languageCode={languageCode}
                provider={sttProvider}
                isDemo={isSttDemo}
                onExtractFacts={handleExtractFacts}
                isExtracting={isExtracting}
                extractError={extractError}
              />
            )}

            {currentStep === 3 && (
              <FactsReviewPanel
                facts={facts}
                setFacts={setFacts}
                onGenerateSummary={handleGenerateSummary}
                isSummarizing={isSummarizing}
                summaryError={summaryError}
                provider={sttProvider}
                isDemo={isSttDemo}
              />
            )}

            {currentStep === 4 && (
              <SummaryApproval
                summary={summary}
                setSummary={setSummary}
                intakeId={intakeId}
                patientDisplayId={patientDisplayId}
                onApproveAndSave={handleApproveAndSave}
                isSaving={isSaving}
                isApproved={isApproved}
                forceDemo={demoModeOverride}
                disclaimer={health?.disclaimer || ''}
              />
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <IntakeDashboard
            intakes={intakesList}
            onRefresh={refreshIntakesList}
            onSelectIntake={(item) => setSelectedIntake(item)}
            onNewIntake={handleStartNewIntake}
          />
        )}
      </main>

      {/* 4. Intake Detail Modal */}
      <IntakeDetailModal
        intake={selectedIntake}
        onClose={() => setSelectedIntake(null)}
        onReopenInWorkflow={handleReopenInWorkflow}
        forceDemo={demoModeOverride}
      />

      {/* 5. Demo Preset Selector Modal */}
      <DemoPresetModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        presets={presets}
        onSelectPreset={handleSelectPreset}
      />

      {/* 6. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Sunniye, Samjhiye (सुनिए, समझिए)</strong> • Built with Sarvam AI (Saaras, Sarvam-105B, Bulbul)
          </span>
          <span className="text-slate-400">
            Hackathon MVP • Local SQLite Persistence • ReportLab PDF Engine
          </span>
        </div>
      </footer>
    </div>
  );
}
export default App;
