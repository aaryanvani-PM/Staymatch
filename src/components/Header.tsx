import React from 'react';
import { SlidersHorizontal, BarChart3, PlusCircle } from 'lucide-react';

interface HeaderProps {
  pinnedCount: number;
  onOpenTradeOff: () => void;
  onOpenMetrics: () => void;
  onOpenSandbox: () => void;
  onResetSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pinnedCount,
  onOpenTradeOff,
  onOpenMetrics,
  onOpenSandbox,
  onResetSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8DFD3] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={onResetSearch}
          className="text-left group cursor-pointer shrink-0"
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-[#0E4D54] group-hover:text-[#146B75] transition-colors whitespace-nowrap">
            StayMatch
          </span>
        </button>

        {/* Zone 2: Single-line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
          <button
            onClick={onResetSearch}
            className="hover:text-[#0E4D54] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Discovery Engine
          </button>
          <a
            href="#pair-principles"
            className="hover:text-[#0E4D54] transition-colors whitespace-nowrap shrink-0"
          >
            PAIR Grounding
          </a>
          <button
            onClick={onOpenMetrics}
            className="hover:text-[#0E4D54] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#0E4D54]" />
            A/B Metrics
          </button>
          <button
            onClick={onOpenSandbox}
            className="hover:text-[#0E4D54] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D97746]" />
            Add Custom Stay
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenTradeOff}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-sm ${
              pinnedCount > 0
                ? 'bg-[#0E4D54] text-white hover:bg-[#146B75]'
                : 'bg-white text-slate-700 border border-[#E8DFD3] hover:bg-[#F5EFE6]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Compare Stays</span>
            {pinnedCount > 0 && (
              <span className="bg-[#D97746] text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                {pinnedCount}/3
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
