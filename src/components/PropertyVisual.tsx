import React, { useState } from 'react';

interface PropertyVisualProps {
  id: string;
  title: string;
  imageUrl: string;
  location: string;
  pricePerNightUsd: number;
  rating: number;
}

export const PropertyVisual: React.FC<PropertyVisualProps> = ({
  id,
  title,
  imageUrl,
  location,
  pricePerNightUsd,
  rating,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Curated theme gradients and stylized SVG silhouettes for resilience
  const getThemeDetails = (propId: string) => {
    switch (propId) {
      case 'prop_krabi_01':
        return {
          bg: 'from-[#0E4D54] via-[#1A636C] to-[#2B7A84]',
          accent: '#A5D6A7',
          tag: 'Private Villa · Cul-de-Sac'
        };
      case 'prop_krabi_02':
        return {
          bg: 'from-[#1E3A5F] via-[#2D5A88] to-[#4A7BB0]',
          accent: '#FFE082',
          tag: 'Pierfront · Ocean Loft'
        };
      case 'prop_krabi_03':
        return {
          bg: 'from-[#2C4A3E] via-[#3E6554] to-[#5C8974]',
          accent: '#E0E7FF',
          tag: 'Limestone Cliff · Car-Free'
        };
      case 'prop_phuket_01':
        return {
          bg: 'from-[#1A4550] via-[#2A6572] to-[#3E8694]',
          accent: '#80DEEA',
          tag: 'Diver Sanctuary · 24/7 Co-Work'
        };
      case 'prop_phuket_02':
        return {
          bg: 'from-[#3B2F4C] via-[#524168] to-[#715B8C]',
          accent: '#FFD54F',
          tag: 'Hillside Infinity · 300 Mbps'
        };
      case 'prop_phuket_03':
        return {
          bg: 'from-[#B25D38] via-[#C97750] to-[#E0946E]',
          accent: '#FFF9C4',
          tag: 'Beachfront Surf · Cafe'
        };
      default:
        return {
          bg: 'from-[#0E4D54] via-[#265F66] to-[#407B83]',
          accent: '#C8E6C9',
          tag: 'Verified Boutique Stay'
        };
    }
  };

  const theme = getThemeDetails(id);

  return (
    <div className="relative w-full h-56 bg-slate-900 overflow-hidden group">
      {!imgFailed ? (
        <img
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${theme.bg} p-6 flex flex-col justify-between text-white relative`}>
          {/* Subtle architectural geometric grid lines */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-white/80 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded">
              {theme.tag}
            </span>
            <span className="text-xs font-mono bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white font-medium">
              ★ {rating.toFixed(2)}
            </span>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-white/70 font-sans tracking-wide uppercase mb-1">{location}</p>
            <h4 className="font-serif text-lg font-medium text-white line-clamp-1">{title}</h4>
          </div>
        </div>
      )}

      {/* Measured contrast scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

      {/* Price overlay on image */}
      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white pointer-events-none">
        <div>
          <span className="text-xs text-white/80 font-sans block">{location}</span>
          <span className="font-serif text-base font-semibold text-white tracking-tight drop-shadow-sm">{title}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold font-mono tracking-tight text-white drop-shadow-sm tabular-nums">
            ${pricePerNightUsd}
            <span className="text-xs font-normal text-white/80 font-sans"> / nt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
