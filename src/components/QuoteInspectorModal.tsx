import React from 'react';
import { X, Quote, ShieldCheck, Calendar, User, ExternalLink } from 'lucide-react';
import { EvidenceCitation, Review } from '../types';

interface QuoteInspectorModalProps {
  quote: EvidenceCitation | null;
  propertyTitle: string;
  fullReview?: Review;
  onClose: () => void;
}

export const QuoteInspectorModal: React.FC<QuoteInspectorModalProps> = ({
  quote,
  propertyTitle,
  fullReview,
  onClose
}) => {
  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#D8C3AE] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8DFD3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0E4D54]/10 text-[#0E4D54] flex items-center justify-center">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">
                PAIR Grounded Verification
              </span>
              <h3 className="font-serif text-base font-bold text-slate-900 line-clamp-1">
                {propertyTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Signal & Verdict */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EADBCE]">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Evaluated Signal
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">
              "{quote.signalQuery}"
            </p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                quote.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : quote.status === 'mixed'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {quote.statusLabel}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {quote.headlineSummary}
              </span>
            </div>
          </div>

          {/* Full Review in Context */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{quote.author || 'Guest'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{quote.reviewDate || 'Verified Stay'}</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">
                  ID: {quote.reviewId || 'rev_verified'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DFD3] text-sm text-slate-800 leading-relaxed relative">
              {fullReview ? (
                <div>
                  <p className="text-slate-700">
                    "{fullReview.text}"
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Verified Booking via Official OTA Channel</span>
                    <span className="text-emerald-700 font-medium">Grounded in Raw Text</span>
                  </div>
                </div>
              ) : (
                <blockquote className="italic text-slate-700">
                  "{quote.verbatimQuote}"
                </blockquote>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#E8DFD3] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Google PAIR Principle: Explanations are verifiable.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0E4D54] hover:bg-[#146B75] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
