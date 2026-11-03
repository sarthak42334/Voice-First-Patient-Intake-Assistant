import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50/90 border-b border-amber-200 text-amber-900 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mandatory Clinical Notice:</strong> This tool records and organizes reported information.
            It does not diagnose, recommend treatment, or replace a healthcare professional.
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-amber-800 hover:text-amber-950 underline font-semibold shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{expanded ? 'Hide Principles' : 'Intake Principles'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-amber-200/70 text-xs grid grid-cols-1 md:grid-cols-3 gap-3 text-amber-800">
          <div className="bg-white/60 p-2.5 rounded border border-amber-200">
            <span className="font-semibold block text-amber-950 mb-0.5">1. Strict Factuality</span>
            Documents only explicitly stated patient quotes. Never infers, guesses, or fills gaps.
          </div>
          <div className="bg-white/60 p-2.5 rounded border border-amber-200">
            <span className="font-semibold block text-amber-950 mb-0.5">2. Human-in-the-Loop</span>
            Healthcare worker must review, verify, or edit every extracted fact and approve summary before export.
          </div>
          <div className="bg-white/60 p-2.5 rounded border border-amber-200">
            <span className="font-semibold block text-amber-950 mb-0.5">3. Non-Diagnostic Guardrail</span>
            No differential diagnoses, triage categorization, or medication prescriptions are generated.
          </div>
        </div>
      )}
    </div>
  );
};

