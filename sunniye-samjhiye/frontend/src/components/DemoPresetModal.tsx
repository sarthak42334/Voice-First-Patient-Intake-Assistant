import React from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { DemoPreset } from '../types';

interface DemoPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: DemoPreset[];
  onSelectPreset: (preset: DemoPreset) => void;
}

export const DemoPresetModal: React.FC<DemoPresetModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Select Synthetic Demo Preset</h3>
              <p className="text-xs text-slate-500">
                1-click realistic clinical intake scenarios designed for hackathon judges & instant evaluation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets List */}
        <div className="overflow-y-auto py-4 space-y-3.5 flex-1 pr-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    {preset.patient_display_id}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{preset.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {preset.language_code}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-2">{preset.audio_description}</p>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 italic line-clamp-2">
                "{preset.raw_transcript}"
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Includes {preset.facts.length} extracted facts with quotes</span>
                <span className="flex items-center gap-1">
                  Load Case <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

