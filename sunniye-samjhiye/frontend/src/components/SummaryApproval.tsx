import React, { useState } from 'react';
import {
  FileText,
  Volume2,
  CheckCircle2,
  Download,
  Save,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Shield,
  Edit2
} from 'lucide-react';
import { playTTS, getPdfExportUrl } from '../api/client';

interface SummaryApprovalProps {
  summary: string;
  setSummary: (s: string) => void;
  intakeId: string | null;
  patientDisplayId: string;
  onApproveAndSave: (workerName: string, notes: string) => Promise<void>;
  isSaving: boolean;
  isApproved: boolean;
  forceDemo: boolean;
  disclaimer: string;
}

export const SummaryApproval: React.FC<SummaryApprovalProps> = ({
  summary,
  setSummary,
  intakeId,
  patientDisplayId,
  onApproveAndSave,
  isSaving,
  isApproved,
  forceDemo,
  disclaimer,
}) => {
  const [workerName, setWorkerName] = useState('Staff Healthcare Worker');
  const [workerNotes, setWorkerNotes] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsMessage, setTtsMessage] = useState<string | null>(null);

  // Audio element ref
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlayTTS = async () => {
    if (!summary) return;
    setIsPlayingTTS(true);
    setTtsMessage(null);

    try {
      const res = await playTTS(summary, 'hi-IN', 'shubh', forceDemo);
      if (res.audio_base64) {
        const audioSrc = `data:audio/wav;base64,${res.audio_base64}`;
        setTtsAudioUrl(audioSrc);
        setTimeout(() => {
          audioPlayerRef.current?.play();
        }, 100);
      } else {
        // Browser Web Speech API fallback
        setTtsMessage(res.message || 'Playing audio via browser speech synthesis...');
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(summary.slice(0, 300));
          utterance.lang = 'hi-IN';
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err: any) {
      setTtsMessage(`TTS playback notice: ${err.message}`);
    } finally {
      setIsPlayingTTS(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!confirmedCheck) {
      alert('Please check the verification confirmation checkbox before approving.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    await onApproveAndSave(workerName, workerNotes);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-0.5">
            Step 4 • Final Summary & Clinician Sign-Off
          </span>
          <h2 className="text-lg font-bold text-slate-900">Review, Approve & Export Intake</h2>
          <p className="text-xs text-slate-500">
            Verify that the structured summary preserves all patient uncertainties and contains no clinical diagnosis.
          </p>
        </div>

        {/* TTS Playback Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayTTS}
            disabled={isPlayingTTS || !summary}
            type="button"
            className="text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Read summary aloud using Sarvam Bulbul"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingTTS ? 'Generating Speech...' : 'Listen Aloud (Sarvam Bulbul)'}</span>
          </button>
        </div>
      </div>

      {ttsAudioUrl && (
        <div className="mt-3 p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center gap-3">
          <span className="text-xs font-semibold text-teal-900">Sarvam Bulbul Voice Audio:</span>
          <audio ref={audioPlayerRef} src={ttsAudioUrl} controls className="h-8 max-w-sm" />
        </div>
      )}

      {ttsMessage && (
        <div className="mt-2 text-xs text-teal-800 bg-teal-50 p-2 rounded border border-teal-200">
          {ttsMessage}
        </div>
      )}

      {/* Editable Summary Area */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="summary-textarea" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Edit2 className="w-3 h-3 text-slate-400" />
            <span>Editable Intake Summary Draft (Worker can revise):</span>
          </label>
          <span className="text-[11px] text-slate-400">Strictly patient-reported statements</span>
        </div>

        <textarea
          id="summary-textarea"
          rows={9}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full text-xs font-mono leading-relaxed p-3.5 border border-slate-300 rounded-lg focus:outline-teal-500 bg-slate-50/40 text-slate-900 resize-y"
        />
      </div>

      {/* Worker Sign-off and Verification Box */}
      <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Healthcare Worker Sign-Off & Verification</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Reviewing Healthcare Worker Name / ID:
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="e.g. Nurse Fatima, CHW-204"
              className="w-full p-2 border border-slate-300 rounded focus:outline-teal-500 bg-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Optional Intake Worker Notes / Clarifications:
            </label>
            <input
              type="text"
              value={workerNotes}
              onChange={(e) => setWorkerNotes(e.target.value)}
              placeholder="e.g. Verified with paper prescription card"
              className="w-full p-2 border border-slate-300 rounded focus:outline-teal-500 bg-white"
            />
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4 border-slate-300 cursor-pointer"
            />
            <span>
              <strong>Worker Attestation:</strong> I confirm I have reviewed this intake with the patient.
              It represents reported statements only, does not constitute a clinical diagnosis, and is ready for the evaluating clinician.
            </span>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {isApproved ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approved & Saved to SQLite Database
            </span>
          ) : (
            <span>Ready for approval and PDF export</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {intakeId && (
            <a
              href={getPdfExportUrl(intakeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </a>
          )}

          <button
            onClick={handleOpenConfirm}
            disabled={isSaving || !summary.trim() || !confirmedCheck}
            type="button"
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to SQLite...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isApproved ? 'Update Approved Intake' : 'Confirm & Save Intake'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-teal-700 mb-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Approve Patient Intake Record?</h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are about to sign off on Patient ID <strong>{patientDisplayId}</strong> as{' '}
              <strong>{workerName}</strong>. The record will be permanently saved to the local SQLite database and will be available for PDF export.
            </p>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs mb-5">
              <strong>Notice:</strong> {disclaimer}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Go Back & Review
              </button>
              <button
                onClick={handleFinalSubmit}
                type="button"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Yes, Approve & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

