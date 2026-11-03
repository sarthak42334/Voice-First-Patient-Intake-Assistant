import React from 'react';
import { FileText, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface TranscriptReviewProps {
  transcript: string;
  setTranscript: (text: string) => void;
  languageCode: string;
  provider: string;
  isDemo: boolean;
  onExtractFacts: () => void;
  isExtracting: boolean;
  extractError: string | null;
}

export const TranscriptReview: React.FC<TranscriptReviewProps> = ({
  transcript,
  setTranscript,
  languageCode,
  provider,
  isDemo,
  onExtractFacts,
  isExtracting,
  extractError,
}) => {
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-0.5">
            Step 2 • Transcript Verification
          </span>
          <h2 className="text-lg font-bold text-slate-900">Review & Correct Transcript</h2>
          <p className="text-xs text-slate-500">
            Verify spoken words with the patient. Correct any misheard terminology before extracting facts.
          </p>
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
            Language: <strong className="text-slate-900">{languageCode}</strong>
          </span>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${
              isDemo
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            STT Provider: <strong>{provider}</strong>
          </span>
        </div>
      </div>

      {/* Editable Textarea */}
      <div className="mt-4">
        <label htmlFor="transcript-editor" className="sr-only">
          Intake Audio Transcript
        </label>
        <textarea
          id="transcript-editor"
          rows={5}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcript will appear here once audio is transcribed, or you can paste text..."
          className="w-full text-sm leading-relaxed p-3.5 border border-slate-300 rounded-lg focus:outline-teal-500 bg-slate-50/40 text-slate-900 resize-y font-sans"
        />

        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
          <span className="italic text-slate-400">Worker edit mode active</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Worker edits will be preserved and used as the ground-truth for extraction.</span>
        </div>

        <button
          onClick={onExtractFacts}
          disabled={isExtracting || !transcript.trim()}
          type="button"
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Extracting Facts via Sarvam-105B...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract Structured Facts (Sarvam-105B)</span>
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {extractError && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{extractError}</span>
        </div>
      )}
    </div>
  );
};

