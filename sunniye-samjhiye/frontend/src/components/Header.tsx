import React from 'react';
import { Stethoscope, Sparkles, Database, PlusCircle, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  demoModeOverride: boolean;
  onToggleDemoMode: () => void;
  activeTab: 'intake' | 'dashboard' | 'presets';
  setActiveTab: (tab: 'intake' | 'dashboard' | 'presets') => void;
  onOpenPresets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  demoModeOverride,
  onToggleDemoMode,
  activeTab,
  setActiveTab,
  onOpenPresets,
}) => {
  const isSarvamLive = health?.sarvam_configured && !demoModeOverride;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sunniye, Samjhiye</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                सुनिए, समझिए
              </span>
            </div>
            <p className="text-xs text-slate-500">Voice-First Patient Intake Assistant • Documentation & Intake Only</p>
          </div>
        </div>

        {/* Center / Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start md:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'intake'
                ? 'bg-white text-teal-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Intake</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-teal-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Saved Intakes Archive</span>
          </button>
          <button
            onClick={onOpenPresets}
            className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-50 transition-all cursor-pointer"
            title="Load realistic synthetic demo cases"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Demo Presets</span>
          </button>
        </div>

        {/* Right: Engine Indicator & Mode Toggle */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
              isSarvamLive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isSarvamLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div className="text-left">
              <span className="font-semibold block leading-tight">
                {isSarvamLive ? 'Sarvam AI Live' : 'Demo / Synthetic Mode'}
              </span>
              <span className="text-[10px] opacity-80">
                {isSarvamLive ? 'Saaras-v4 • Sarvam-105B • Bulbul' : 'Offline Safe Fallback'}
              </span>
            </div>
          </div>

          <button
            onClick={onToggleDemoMode}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 px-2 py-1.5 rounded-md bg-white hover:bg-slate-50 transition-all cursor-pointer"
            title={demoModeOverride ? 'Switch back to Live Sarvam AI' : 'Force Demo Mode for testing'}
          >
            {demoModeOverride ? (
              <>
                <ToggleRight className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Demo Active</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Live Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

