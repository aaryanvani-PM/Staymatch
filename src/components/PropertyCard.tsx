import React from 'react';
import { Check, CheckCircle2, AlertTriangle, HelpCircle, Pin, ExternalLink, Wifi, Volume2, Anchor, Briefcase, Sparkles } from 'lucide-react';
import { PropertyEvidenceResult, EvidenceCitation, Review } from '../types';
import { PropertyVisual } from './PropertyVisual';

interface PropertyCardProps {
  result: PropertyEvidenceResult;
  isPinned: boolean;
  canPinMore: boolean;
  onTogglePin: (propertyId: string) => void;
  onInspectQuote: (quote: EvidenceCitation, propertyTitle: string, fullReview?: Review) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  result,
  isPinned,
  canPinMore,
  onTogglePin,
  onInspectQuote
}) => {
  const { property, hardFilterMatch, hardFilterReasons, evidenceBadges, strengths, tradeOffNote } = result;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wifi':
        return <Wifi className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
      case 'noise':
        return <Volume2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
      case 'diving':
        return <Anchor className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
      case 'workspace':
        return <Briefcase className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (badge: EvidenceCitation) => {
    switch (badge.status) {
      case 'verified':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>Verified by Guests</span>
          </div>
        );
      case 'mixed':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Mixed Feedback</span>
          </div>
        );
      case 'unmentioned':
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            <span>Not Mentioned in Reviews</span>
          </div>
        );
    }
  };

  return (
    <article
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isPinned
          ? 'border-[#0E4D54] ring-2 ring-[#0E4D54]/20 shadow-md'
          : 'border-[#E8DFD3] hover:border-[#D8C3AE] hover:shadow-md'
      } ${!hardFilterMatch ? 'opacity-80 bg-slate-50/50' : ''}`}
    >
      <div>
        {/* Visual Hero */}
        <div className="relative">
          <PropertyVisual
            id={property.id}
            title={property.title}
            imageUrl={property.heroImage}
            location={property.location}
            pricePerNightUsd={property.pricePerNightUsd}
            rating={property.rating}
          />

          {/* Pin to Compare Floating Button */}
          <button
            onClick={() => onTogglePin(property.id)}
            disabled={!isPinned && !canPinMore}
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isPinned
                ? 'bg-[#0E4D54] text-white shadow-md'
                : canPinMore
                ? 'bg-white/90 hover:bg-white text-slate-800 hover:text-[#0E4D54]'
                : 'bg-white/60 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current rotate-45' : ''}`} />
            <span>{isPinned ? 'Pinned to Compare' : 'Pin to Compare'}</span>
          </button>

          {/* Filter Status Warning Banner if hard filter failed */}
          {!hardFilterMatch && (
            <div className="absolute bottom-0 inset-x-0 bg-red-900/90 text-white text-[11px] px-3 py-1 font-medium backdrop-blur-xs flex items-center justify-between">
              <span>Filter Conflict: {hardFilterReasons[0]}</span>
              <span className="font-mono text-[10px] uppercase">Excluded from default</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>{property.region}</span>
            <span aria-hidden="true">·</span>
            <span>★ {property.rating.toFixed(2)} ({property.reviewCount} reviews)</span>
            <span aria-hidden="true">·</span>
            <span>{property.distanceToDiveCenterMins} min to dive center</span>
          </div>

          <h3 className="font-serif text-xl font-bold text-slate-900 tracking-tight leading-snug mb-1">
            {property.title}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {property.tagline}
          </p>

          {/* Sensory Vibe & Traveler Feeling */}
          <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F5EFE6] p-3 rounded-lg border border-[#EADBCE] text-xs mb-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#0E4D54] tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-[#D97746]" />
              <span>Sensory Vibe & Atmosphere</span>
            </div>
            <p className="font-serif font-semibold text-slate-900 text-xs mb-1">
              {result.vibeAtmosphere}
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              "{result.travelerFeeling}"
            </p>
          </div>

          {/* PAIR Review Evidence Matrix */}
          <div className="border-t border-[#F5EFE6] pt-3 mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              PAIR Review Evidence Matrix
            </div>

            <div className="space-y-2.5">
              {evidenceBadges.map((badge, idx) => {
                const fullReview = property.reviews.find(r => r.id === badge.reviewId);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      badge.status === 'verified'
                        ? 'bg-emerald-50/50 border-emerald-200/70'
                        : badge.status === 'mixed'
                        ? 'bg-amber-50/50 border-amber-200/70'
                        : 'bg-slate-50/70 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 truncate">
                        {getCategoryIcon(badge.category)}
                        <span className="truncate">{badge.signalQuery}</span>
                      </div>
                      {getStatusBadge(badge)}
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-1 mb-1">
                      {badge.headlineSummary}
                    </p>

                    {badge.verbatimQuote ? (
                      <button
                        type="button"
                        onClick={() => onInspectQuote(badge, property.title, fullReview)}
                        className="text-left w-full group/quote cursor-pointer"
                      >
                        <blockquote className="text-[11px] text-slate-600 italic line-clamp-2 border-l-2 border-[#0E4D54]/30 pl-2 group-hover/quote:border-[#0E4D54] transition-colors">
                          "{badge.verbatimQuote}"
                        </blockquote>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 group-hover/quote:text-[#0E4D54] transition-colors">
                          <span>— {badge.author || 'Guest'} · {badge.reviewDate}</span>
                          <span className="font-medium underline flex items-center gap-0.5">
                            Verify quote <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </button>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Not specifically validated in verified guest reviews.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Planted Trade-Off Summary */}
          <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#EADBCE] text-xs">
            <span className="font-semibold text-slate-800 block mb-1">
              Honest Trade-Off Note:
            </span>
            <p className="text-slate-600 leading-relaxed">
              {tradeOffNote}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3.5 bg-[#FAF7F2] border-t border-[#E8DFD3] flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">${property.pricePerNightUsd}</span> / night
        </div>
        <button
          onClick={() => onTogglePin(property.id)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
            isPinned
              ? 'bg-[#0E4D54] text-white hover:bg-[#146B75]'
              : 'text-[#0E4D54] hover:bg-[#EADBCE]/50 border border-[#0E4D54]/30'
          }`}
        >
          {isPinned ? 'In Comparison' : '+ Pin to Compare'}
        </button>
      </div>
    </article>
  );
};
