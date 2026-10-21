import React from 'react';
import { X, SlidersHorizontal, Check, Minus, Sparkles, ExternalLink, HelpCircle, ShieldAlert, ArrowRight, Zap } from 'lucide-react';
import { Property, TradeOffVerdict } from '../types';

interface TradeOffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedProperties: Property[];
  onRemovePinned: (propertyId: string) => void;
  tradeOffVerdict: TradeOffVerdict | null;
  isLoadingVerdict: boolean;
  onRefreshVerdict: () => void;
}

export const TradeOffDrawer: React.FC<TradeOffDrawerProps> = ({
  isOpen,
  onClose,
  pinnedProperties,
  onRemovePinned,
  tradeOffVerdict,
  isLoadingVerdict,
  onRefreshVerdict,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#D8C3AE] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E8DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0E4D54]/10 flex items-center justify-center text-[#0E4D54]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  3-Way Smart Trade-Off Drawer
                </h2>
                <span className="bg-[#0E4D54] text-white text-[11px] font-mono px-2 py-0.5 rounded font-semibold">
                  {pinnedProperties.length}/3 Pinned
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grounded comparison: What you gain, what you sacrifice, and actionable persona recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshVerdict}
              disabled={isLoadingVerdict || pinnedProperties.length === 0}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D8C3AE] hover:bg-[#F5EFE6] text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D97746]" />
              <span>{isLoadingVerdict ? 'Synthesizing...' : 'Re-Synthesize'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {pinnedProperties.length === 0 ? (
            <div className="text-center py-12">
              <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold text-slate-800">
                No stays pinned yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Click "+ Pin to Compare" on 2 or 3 property cards in the search results to generate a side-by-side trade-off synthesis.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#0E4D54] text-white text-xs font-semibold rounded-lg hover:bg-[#146B75] transition-colors cursor-pointer"
              >
                Back to Listings
              </button>
            </div>
          ) : (
            <>
              {/* Pinned Stays Header Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pinnedProperties.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-xl border border-[#E8DFD3] flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">
                        {p.region} · ${p.pricePerNightUsd}/night
                      </span>
                      <h4 className="font-serif text-sm font-semibold text-slate-900 truncate">
                        {p.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => onRemovePinned(p.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
                      title="Unpin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - pinnedProperties.length) }).map((_, i) => (
                  <div
                    key={i}
                    className="border-2 border-dashed border-[#D8C3AE]/60 rounded-xl p-3.5 flex items-center justify-center text-xs text-slate-400"
                  >
                    + Pin another stay to compare
                  </div>
                ))}
              </div>

              {/* Executive AI Synthesis Callout */}
              {tradeOffVerdict && (
                <div className="bg-[#0E4D54] text-white p-5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#80DEEA] mb-2">
                    <Sparkles className="w-4 h-4 text-[#D97746]" />
                    <span>Executive Trade-Off Verdict</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium leading-snug mb-2 text-white">
                    {tradeOffVerdict.overallVerdict}
                  </h3>
                  <div className="bg-white/10 rounded-lg p-3 text-xs leading-relaxed text-white/95 border border-white/10">
                    <strong className="text-[#80DEEA] block mb-1">
                      Bottom-Line Recommendation:
                    </strong>
                    {tradeOffVerdict.executiveRecommendation}
                  </div>
                </div>
              )}

              {/* Gains vs Sacrifices Comparison Cards */}
              {tradeOffVerdict && tradeOffVerdict.comparisonMatrix && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tradeOffVerdict.comparisonMatrix.map((item) => (
                    <div
                      key={item.propertyId}
                      className="bg-white rounded-xl border border-[#E8DFD3] p-4 flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="border-b border-[#F5EFE6] pb-2.5 mb-3">
                          <h4 className="font-serif text-base font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h4>
                          {item.vibeAtmosphere && (
                            <div className="mt-2 p-2 bg-[#FAF7F2] rounded border border-[#EADBCE] text-[11px]">
                              <span className="font-semibold text-[#0E4D54] block mb-0.5">
                                ✨ {item.vibeAtmosphere}
                              </span>
                              {item.travelerFeeling && (
                                <p className="text-slate-600 italic leading-relaxed">
                                  "{item.travelerFeeling}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Gains */}
                        <div className="mb-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            What You Gain
                          </span>
                          <ul className="space-y-1.5">
                            {item.whatYouGain.map((gain, idx) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{gain}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Sacrifices */}
                        <div className="mb-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            What You Sacrifice
                          </span>
                          <ul className="space-y-1.5">
                            {item.whatYouSacrifice.map((loss, idx) => (
                              <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <Minus className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{loss}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Best For / Avoid */}
                      <div className="border-t border-[#F5EFE6] pt-3 mt-3 text-xs space-y-2 bg-[#FAF7F2] p-2.5 rounded-lg">
                        <div>
                          <strong className="text-slate-900 block font-medium">Best Suited For:</strong>
                          <p className="text-slate-600 mt-0.5">{item.bestSuitedFor}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 block font-medium">Avoid If:</strong>
                          <p className="text-slate-600 mt-0.5">{item.notIdealFor}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Side-by-Side Detailed Matrix Table */}
              {tradeOffVerdict && tradeOffVerdict.comparisonMatrix && (
                <div className="bg-white rounded-xl border border-[#E8DFD3] overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-[#FAF7F2] border-b border-[#E8DFD3]">
                    <h4 className="font-serif text-sm font-semibold text-slate-900">
                      Objective Logistics Matrix
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F5EFE6]/60 text-slate-700 font-semibold border-b border-[#E8DFD3]">
                        <tr>
                          <th className="p-3.5 w-1/4">Criteria</th>
                          {tradeOffVerdict.comparisonMatrix.map(c => (
                            <th key={c.propertyId} className="p-3.5">{c.title}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5EFE6]">
                        <tr>
                          <td className="p-3.5 font-medium text-slate-700">Wi-Fi & Connectivity</td>
                          {tradeOffVerdict.comparisonMatrix.map(c => (
                            <td key={c.propertyId} className="p-3.5 text-slate-800">{c.wifiRating}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3.5 font-medium text-slate-700">Ambient Noise & Sleep</td>
                          {tradeOffVerdict.comparisonMatrix.map(c => (
                            <td key={c.propertyId} className="p-3.5 text-slate-800">{c.noiseVerdict}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3.5 font-medium text-slate-700">Diving Boat Logistics</td>
                          {tradeOffVerdict.comparisonMatrix.map(c => (
                            <td key={c.propertyId} className="p-3.5 text-slate-800">{c.divingLogistics}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Bottom Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#E8DFD3] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Citations grounded in verified guest reviews from 2026.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0E4D54] hover:bg-[#146B75] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
