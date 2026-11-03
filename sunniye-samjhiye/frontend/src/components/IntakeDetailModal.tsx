import React, { useState } from 'react';
import {
  X,
  Download,
  Volume2,
  FileText,
  CheckCircle2,
  Quote,
  ShieldAlert,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Intake } from '../types';
import { getPdfExportUrl, playTTS } from '../api/client';

interface IntakeDetailModalProps {
  intake: Intake | null;
  onClose: () => void;
  onReopenInWorkflow: (intake: Intake) => void;
  forceDemo: boolean;
}

export const IntakeDetailModal: React.FC<IntakeDetailModalProps> = ({
  intake,
  onClose,
  onReopenInWorkflow,
  forceDemo,
}) => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!intake) return null;

  const handlePlayTTS = async () => {
    const textToSpeak = intake.summary_approved || intake.summary_draft || '';
    if (!textToSpeak) return;
    setIsPlayingTTS(true);

    try {
      const res = await playTTS(textToSpeak, intake.transcript_language || 'hi-IN', 'shubh', forceDemo);
      if (res.audio_base64) {
        const src = `data:audio/wav;base64,${res.audio_base64}`;
        setTtsAudioUrl(src);
        setTimeout(() => audioRef.current?.play(), 100);
      } else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(textToSpeak.slice(0, 300));
        window.speechSynthesis.speak(u);
      }
    } catch (err: any) {
      alert(`TTS error: ${err.message}`);
    } finally {
      setIsPlayingTTS(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-lg">
              {intake.patient_display_id}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Intake Record Inspection</h3>
              <p className="text-xs text-slate-500">
                Created {new Date(intake.created_at).toLocaleString()} • {intake.provider}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getPdfExportUrl(intake.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-5 text-xs text-slate-700 pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="font-semibold text-slate-800 capitalize">{intake.status}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sign-Off Clinician</span>
              <span className="font-semibold text-slate-800">
                {intake.approved_by_worker || 'Pending sign-off'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Language</span>
              <span className="font-semibold text-slate-800">{intake.transcript_language || 'hi-IN'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Audio Storage</span>
              <span className="font-semibold text-slate-800">
                {intake.audio_stored ? 'Stored' : 'Ephemeral (Privacy)'}
              </span>
            </div>
          </div>

          {/* Approved Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Patient Intake Summary</span>
              </h4>
              <button
                onClick={handlePlayTTS}
                disabled={isPlayingTTS}
                type="button"
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlayingTTS ? 'Playing...' : 'Play Voice Aloud'}</span>
              </button>
            </div>

            {ttsAudioUrl && (
              <div className="mb-2">
                <audio ref={audioRef} src={ttsAudioUrl} controls className="h-8 w-full" />
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed text-xs">
              {intake.summary_approved || intake.summary_draft || 'No summary available.'}
            </div>
          </div>

          {/* Verified Facts Table */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Extracted & Verified Patient Facts</span>
            </h4>

            <div className="space-y-2.5">
              {intake.facts && intake.facts.length > 0 ? (
                intake.facts.map((fact) => (
                  <div key={fact.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{fact.label}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {fact.status}
                      </span>
                    </div>
                    <p className="text-slate-800 mb-1.5">{fact.value}</p>
                    {fact.quote && (
                      <div className="flex items-start gap-1 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                        <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>"{fact.quote}"</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No structured facts extracted yet.</p>
              )}
            </div>
          </div>

          {/* Full Reviewed Transcript */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2">Original Spoken Transcript</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {intake.reviewed_transcript || intake.raw_transcript || 'No transcript record.'}
            </div>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{intake.disclaimer}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => onReopenInWorkflow(intake)}
            type="button"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            Re-open in Intake Editor
          </button>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

