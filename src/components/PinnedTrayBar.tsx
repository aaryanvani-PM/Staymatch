import React from 'react';
import { SlidersHorizontal, X, ArrowUpRight } from 'lucide-react';
import { Property } from '../types';

interface PinnedTrayBarProps {
  pinnedProperties: Property[];
  onOpenTradeOff: () => void;
  onRemovePinned: (id: string) => void;
  onClearAll: () => void;
}

export const PinnedTrayBar: React.FC<PinnedTrayBarProps> = ({
  pinnedProperties,
  onOpenTradeOff,
  onRemovePinned,
  onClearAll,
}) => {
  if (pinnedProperties.length === 0) return null;

  return (
    <aside aria-label="Pinned Stays Comparison Bar" className="fixed bottom-0 inset-x-0 z-30 bg-[#0E4D54] text-white py-3 px-4 sm:px-6 shadow-2xl border-t border-[#146B75] transition-all animate-in slide-in-from-bottom-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Pinned thumbnails & count */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-serif text-sm sm:text-base font-bold whitespace-nowrap">
              Trade-Off Tray
            </span>
            <span className="bg-[#D97746] text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
              {pinnedProperties.length}/3
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pinnedProperties.map((p) => (
              <div
                key={p.id}
                className="bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 text-xs shrink-0 max-w-[200px]"
              >
                <span className="truncate font-medium">{p.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePinned(p.id);
                  }}
                  className="text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onClearAll}
            className="text-xs text-white/70 hover:text-white underline cursor-pointer hidden sm:inline"
          >
            Clear all
          </button>

          <button
            onClick={onOpenTradeOff}
            className="px-4 py-2 bg-white text-[#0E4D54] hover:bg-[#FAF7F2] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Open 3-Way Verdict</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
