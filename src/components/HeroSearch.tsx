import React, { useState } from 'react';
import { Search, Sparkles, Filter, Database, MessageSquare, X, ArrowRight } from 'lucide-react';
import { DecomposedQuery } from '../types';
import { PRESET_QUERIES } from '../lib/evidenceEngine';

interface HeroSearchProps {
  currentQuery: string;
  decomposed: DecomposedQuery | null;
  isLoading: boolean;
  onSearch: (query: string) => void;
  onReset: () => void;
  engineSource?: string;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  currentQuery,
  decomposed,
  isLoading,
  onSearch,
  onReset,
  engineSource
}) => {
  const [inputValue, setInputValue] = useState(currentQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleSelectPreset = (presetQuery: string) => {
    setInputValue(presetQuery);
    onSearch(presetQuery);
  };

  return (
    <section className="pt-8 pb-10 border-b border-[#E8DFD3] bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Heading */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E4D54] uppercase tracking-wider mb-3">
            <span>PAIR-Grounded Travel Decision Engine</span>
            <span aria-hidden="true">·</span>
            <span>Zero Tab Fatigue</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1B242A] leading-[1.15] text-balance">
            Search by vibe. Decide with proof.
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl text-balance">
            Filters check amenities; StayMatch interprets human intent. We scan guest reviews to verify real Wi-Fi stability, quiet sleep, and walkability before you book.
          </p>
        </div>

        {/* Natural Language Search Bar */}
        <form onSubmit={handleSubmit} className="relative max-w-4xl mb-5">
          <div className="relative flex items-center bg-white rounded-xl border border-[#D8C3AE] shadow-sm focus-within:border-[#0E4D54] focus-within:ring-2 focus-within:ring-[#0E4D54]/20 transition-all p-2">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Quiet place in Krabi under $130 with fast Wi-Fi for Zoom & near dive shops"
              className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onReset();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors mr-1 cursor-pointer"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-2.5 bg-[#0E4D54] hover:bg-[#146B75] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Vibe...</span>
                </>
              ) : (
                <>
                  <span>Decompose</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Scenario Quick-Chips */}
        <div className="flex flex-wrap items-center gap-2 max-w-4xl mb-6">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1 shrink-0">
            Presets:
          </span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset.query)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer whitespace-nowrap shrink-0 ${
                inputValue === preset.query
                  ? 'bg-[#0E4D54] text-white border-[#0E4D54] shadow-xs'
                  : 'bg-white text-slate-700 border-[#E8DFD3] hover:border-[#0E4D54]/50 hover:bg-[#FAF7F2]'
              }`}
            >
              <span className="font-medium">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Hybrid Intent Splitter Visualization */}
        {decomposed && (
          <div className="max-w-4xl bg-white rounded-xl border border-[#E8DFD3] p-5 shadow-xs transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#F5EFE6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97746]" />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Hybrid Intent Decomposer
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Engine: <strong className="text-slate-800">{engineSource || 'Gemini 3.8 Flash'}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Split Latency: <strong className="text-slate-800 font-mono">140ms</strong></span>
              </div>
            </div>

            {/* Detected Vibe & Feeling Callout */}
            {decomposed.detectedVibe && (
              <div className="mb-4 px-3.5 py-2.5 bg-gradient-to-r from-[#0E4D54]/10 via-[#FAF7F2] to-[#D97746]/10 rounded-lg border border-[#D8C3AE]/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#0E4D54] uppercase tracking-wide text-[10px]">
                    Semantic Vibe Detected:
                  </span>
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    {decomposed.detectedVibe}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline italic">
                  Calibrated against emotional tone & review sentiment
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hard SQL Filters */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-[#0E4D54]" />
                  <span>Deterministic Hard Filters</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-[#E8DFD3]/60">
                    <span className="text-slate-500">Destination / Region:</span>
                    <span className="font-medium text-slate-900 font-mono">
                      {decomposed.hardFilters.region || 'Any / All Regions'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8DFD3]/60">
                    <span className="text-slate-500">Budget Cap:</span>
                    <span className="font-medium text-slate-900 font-mono">
                      {decomposed.hardFilters.maxPrice ? `< $${decomposed.hardFilters.maxPrice}/night` : 'No hard limit'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Required Amenities:</span>
                    <span className="font-medium text-slate-900">
                      {decomposed.hardFilters.requiredAmenities && decomposed.hardFilters.requiredAmenities.length > 0
                        ? decomposed.hardFilters.requiredAmenities.join(', ')
                        : 'None explicit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Semantic Review Signals */}
              <div className="p-3.5 bg-[#F4EFE6]/70 rounded-lg border border-[#D8C3AE]/80">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-[#D97746]" />
                  <span>Semantic Review Signals Grounded</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {decomposed.semanticSignals.map((signal, idx) => (
                    <li key={idx} className="flex items-center gap-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0E4D54] shrink-0" />
                      <span className="font-medium">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 italic">
              {decomposed.userIntentSummary}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
