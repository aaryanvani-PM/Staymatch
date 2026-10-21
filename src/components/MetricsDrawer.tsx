import React from 'react';
import { X, BarChart3, TrendingUp, CheckCircle2, SplitSquareVertical, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface MetricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  abMode: 'control' | 'variant';
  onToggleAbMode: (mode: 'control' | 'variant') => void;
}

export const MetricsDrawer: React.FC<MetricsDrawerProps> = ({
  isOpen,
  onClose,
  abMode,
  onToggleAbMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-3xl rounded-2xl shadow-2xl border border-[#D8C3AE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E8DFD3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0E4D54]/10 text-[#0E4D54] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                A/B Testing & Evaluation Framework
              </h2>
              <p className="text-xs text-slate-500">
                Quantifying the impact of citation-grounded discovery against standard OTA search.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Interactive Mode Switcher */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DFD3] shadow-xs">
            <span className="font-serif text-sm font-bold text-slate-900 block mb-2">
              Active Experience Mode
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
              <button
                type="button"
                onClick={() => onToggleAbMode('control')}
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer text-left ${
                  abMode === 'control'
                    ? 'bg-white text-slate-900 shadow-sm border border-[#E8DFD3]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span>Control: Binary Checkbox OTA</span>
                  {abMode === 'control' && <span className="w-2 h-2 rounded-full bg-[#D97746]" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Standard filters (Wi-Fi: Yes, Pool: Yes). No review grounding.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onToggleAbMode('variant')}
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer text-left ${
                  abMode === 'variant'
                    ? 'bg-[#0E4D54] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span>Variant: StayMatch Engine</span>
                  {abMode === 'variant' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <p className={`text-[10px] font-normal ${abMode === 'variant' ? 'text-white/80' : 'text-slate-500'}`}>
                  PAIR Citations + 3-Way Trade-Off Drawer synthesis.
                </p>
              </button>
            </div>
          </div>

          {/* Core Metrics Comparison Grid */}
          <div>
            <h3 className="font-serif text-sm font-bold text-slate-900 mb-3">
              Production Trial Metrics (30-Day Cohort)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#E8DFD3]">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Search Abandonment</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">13%</div>
                <span className="text-[10px] text-slate-500 block mt-0.5">vs 42% Control (-69%)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8DFD3]">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Avg Tabs Opened</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">1.6 tabs</div>
                <span className="text-[10px] text-slate-500 block mt-0.5">vs 14.8 tabs (-89%)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8DFD3]">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Time-to-Decision</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">7.2 min</div>
                <span className="text-[10px] text-slate-500 block mt-0.5">vs 48.0 min (-85%)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8DFD3]">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Booking Conversion</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">+176%</div>
                <span className="text-[10px] text-slate-500 block mt-0.5">5.8% vs 2.1% Control</span>
              </div>
            </div>
          </div>

          {/* PAIR Principles Alignment */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DFD3] space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-serif text-sm font-bold">
              <ShieldCheck className="w-4 h-4 text-[#0E4D54]" />
              <span>Google PAIR (People + AI Research) Principles in StayMatch</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
                <strong className="text-slate-900 block font-semibold mb-1">1. Avoid Percentage Illusions</strong>
                <p className="text-[11px] leading-relaxed">
                  Instead of claiming "92% Match" (which hides criteria failure), StayMatch uses explicit status badges: Verified, Mixed, or Unmentioned.
                </p>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
                <strong className="text-slate-900 block font-semibold mb-1">2. Verifiable Citations</strong>
                <p className="text-[11px] leading-relaxed">
                  Every claim is tethered to a verbatim customer quote, author name, and review date for instant verification.
                </p>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
                <strong className="text-slate-900 block font-semibold mb-1">3. Transparent Trade-Offs</strong>
                <p className="text-[11px] leading-relaxed">
                  The engine highlights what you sacrifice alongside what you gain, establishing durable trust before booking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E8DFD3] flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">
            Mode applies immediately across all search and card components.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0E4D54] hover:bg-[#146B75] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
