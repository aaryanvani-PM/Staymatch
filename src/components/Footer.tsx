import React from 'react';

interface FooterProps {
  onOpenMetrics: () => void;
  onOpenSandbox: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenMetrics, onOpenSandbox }) => {
  return (
    <footer className="bg-white border-t border-[#E8DFD3] py-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-serif text-lg font-bold text-[#0E4D54]">
            StayMatch
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span>Citation-backed semantic discovery & trade-off engine for high-consideration stays.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#pair-principles" className="hover:text-[#0E4D54] transition-colors">
            PAIR Principles
          </a>
          <button
            onClick={onOpenMetrics}
            className="hover:text-[#0E4D54] transition-colors cursor-pointer"
          >
            A/B Metrics
          </button>
          <button
            onClick={onOpenSandbox}
            className="hover:text-[#0E4D54] transition-colors cursor-pointer"
          >
            Custom Sandbox
          </button>
        </div>
      </div>
    </footer>
  );
};
