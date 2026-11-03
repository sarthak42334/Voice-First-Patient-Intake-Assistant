import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Edit3,
  HelpCircle,
  Quote,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Check
} from 'lucide-react';
import { FactItem, FactStatus } from '../types';

interface FactsReviewPanelProps {
  facts: FactItem[];
  setFacts: React.Dispatch<React.SetStateAction<FactItem[]>>;
  onGenerateSummary: () => void;
  isSummarizing: boolean;
  summaryError: string | null;
  provider: string;
  isDemo: boolean;
}

export const FactsReviewPanel: React.FC<FactsReviewPanelProps> = ({
  facts,
  setFacts,
  onGenerateSummary,
  isSummarizing,
  summaryError,
  provider,
  isDemo,
}) => {
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editQuote, setEditQuote] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  const handleStartEdit = (fact: FactItem) => {
    setEditingFactId(fact.id);
    setEditValue(fact.value);
    setEditQuote(fact.quote);
    setEditNote(fact.worker_note || '');
  };

  const handleSaveEdit = (factId: string) => {
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id === factId) {
          return {
            ...f,
            value: editValue.trim() || 'Not provided',
            quote: editQuote.trim(),
            worker_note: editNote.trim() || null,
            status: 'edited' as FactStatus,
          };
        }
        return f;
      })
    );
    setEditingFactId(null);
  };

  const handleSetStatus = (factId: string, status: FactStatus) => {
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id === factId) {
          return { ...f, status };
        }
        return f;
      })
    );
  };

  const handleConfirmAll = () => {
    setFacts((prev) =>
      prev.map((f) => {
        if (f.status === 'needs_review' || f.status === 'edited') {
          return { ...f, status: 'confirmed' as FactStatus };
        }
        return f;
      })
    );
  };

  const getStatusBadge = (status: FactStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'edited':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Worker Edited
          </span>
        );
      case 'needs_review':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Needs Review
          </span>
        );
      case 'unclear':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Unclear / Ambiguous
          </span>
        );
      case 'not_provided':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            Not Provided
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
    }
  };

  const allReviewed = facts.every((f) => f.status !== 'needs_review');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-0.5">
            Step 3 • Fact Verification & Quote Verification
          </span>
          <h2 className="text-lg font-bold text-slate-900">Extracted Facts & Source Quotes</h2>
          <p className="text-xs text-slate-500">
            Every item must be supported by an exact patient quote. Confirm, edit, or reject each item.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirmAll}
            type="button"
            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm All Pending</span>
          </button>
        </div>
      </div>

      {/* Facts Cards List */}
      <div className="space-y-3.5 mt-4">
        {facts.map((fact) => {
          const isEditing = editingFactId === fact.id;

          return (
            <div
              key={fact.id}
              className={`rounded-xl border p-4 transition-all ${
                fact.status === 'confirmed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : fact.status === 'rejected'
                  ? 'border-rose-200 bg-rose-50/20 opacity-75'
                  : fact.status === 'not_provided'
                  ? 'border-slate-200 bg-slate-50/50'
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{fact.label}</span>
                  {getStatusBadge(fact.status)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Confidence: {Math.round(fact.confidence * 100)}%
                  </span>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetStatus(fact.id, 'confirmed')}
                        type="button"
                        className={`p-1 rounded hover:bg-emerald-100 text-emerald-700 cursor-pointer ${
                          fact.status === 'confirmed' ? 'bg-emerald-100 font-bold' : ''
                        }`}
                        title="Confirm as accurate patient statement"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(fact)}
                        type="button"
                        className="p-1 rounded hover:bg-sky-100 text-sky-700 cursor-pointer"
                        title="Edit value, quote, or add note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSetStatus(fact.id, 'unclear')}
                        type="button"
                        className="p-1 rounded hover:bg-orange-100 text-orange-700 cursor-pointer"
                        title="Flag as Unclear or Ambiguous"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSetStatus(fact.id, 'rejected')}
                        type="button"
                        className="p-1 rounded hover:bg-rose-100 text-rose-700 cursor-pointer"
                        title="Reject item (not reported)"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              {isEditing ? (
                <div className="mt-3 space-y-3 bg-white p-3 rounded-lg border border-sky-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Reported Information / Value:
                    </label>
                    <textarea
                      rows={2}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Supporting Transcript Quote:
                    </label>
                    <input
                      type="text"
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Healthcare Worker Clarification Note (Optional):
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="e.g. Verified with patient's prescription slip"
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-teal-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingFactId(null)}
                      type="button"
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(fact.id)}
                      type="button"
                      className="px-3 py-1 text-xs bg-teal-600 text-white rounded font-semibold hover:bg-teal-700 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{fact.value}</p>

                  {/* Verbatim quote */}
                  {fact.quote ? (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 bg-white/70 border border-slate-200/80 rounded-md p-2">
                      <Quote className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="italic font-serif">"{fact.quote}"</span>
                    </div>
                  ) : (
                    <span className="inline-block mt-1.5 text-[11px] text-slate-400 italic">
                      No direct spoken quote mentioned in transcript.
                    </span>
                  )}

                  {/* Worker note if any */}
                  {fact.worker_note && (
                    <div className="mt-2 text-xs text-teal-800 bg-teal-50/60 border border-teal-200 rounded px-2.5 py-1">
                      <strong>Worker Note:</strong> {fact.worker_note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Proceed to Summary */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {!allReviewed && (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Some items have pending reviews. You can confirm them or proceed.
            </span>
          )}
        </div>

        <button
          onClick={onGenerateSummary}
          disabled={isSummarizing || facts.length === 0}
          type="button"
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isSummarizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Summary via Sarvam-105B...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-4 h-4" />
              <span>Draft Intake Summary (Sarvam-105B)</span>
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {summaryError && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{summaryError}</span>
        </div>
      )}
    </div>
  );
};

