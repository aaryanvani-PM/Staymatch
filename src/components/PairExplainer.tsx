import React from 'react';
import { ShieldCheck, Quote, Scale, Sparkles, AlertCircle } from 'lucide-react';

export const PairExplainer: React.FC = () => {
  return (
    <section id="pair-principles" className="py-16 bg-[#F5EFE6]/60 border-t border-[#E8DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E4D54] uppercase tracking-wider mb-2">
            <span>PAIR Framework Alignment</span>
            <span aria-hidden="true">·</span>
            <span>Human-Centered AI</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            Why StayMatch bans arbitrary percentage match scores
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Standard AI search engines display confidence badges like "94% Match", which mislead users because a single undisclosed failure—such as dropped Wi-Fi during team standups—ruins a high-consideration workcation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#E8DFD3] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-900 mb-2">
              01. Strict Qualitative Statuses
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every signal query is evaluated into three unambiguous states: <strong>🟢 Verified by Guests</strong>, <strong>🟡 Mixed Feedback</strong>, or <strong>⚪ Not Mentioned in Reviews</strong>. No false confidence.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E8DFD3] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#0E4D54]/10 text-[#0E4D54] flex items-center justify-center mb-4">
              <Quote className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-900 mb-2">
              02. Verbatim Line-Item Proof
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instead of paraphrased summaries that smooth over negative feedback, each status pill links directly to the unaltered customer testimony, reviewer author, and verified booking date.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E8DFD3] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#D97746]/10 text-[#D97746] flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-slate-900 mb-2">
              03. Honest Trade-Off Verdicts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every listing has inherent trade-offs: fiber Wi-Fi in a quiet cul-de-sac means a 15-minute commute for dinner; pierfront access means live bar bass until 1:00 AM. We explicitly state what you sacrifice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
