import React from 'react';
import { Sliders, ArrowUpDown, MapPin, DollarSign } from 'lucide-react';

interface FilterToolbarProps {
  totalResults: number;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  maxPrice: number;
  onChangeMaxPrice: (price: number) => void;
  selectedAmenity: string;
  onSelectAmenity: (amenity: string) => void;
  sortBy: 'score' | 'price-asc' | 'price-desc' | 'rating' | 'dive-proximity';
  onChangeSortBy: (sort: 'score' | 'price-asc' | 'price-desc' | 'rating' | 'dive-proximity') => void;
  onResetFilters: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  totalResults,
  selectedRegion,
  onSelectRegion,
  maxPrice,
  onChangeMaxPrice,
  selectedAmenity,
  onSelectAmenity,
  sortBy,
  onChangeSortBy,
  onResetFilters,
}) => {
  return (
    <div className="bg-white border-y border-[#E8DFD3] py-3.5 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Region & Quick Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
            Regions:
          </span>
          <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-lg border border-[#EADBCE]">
            {['All', 'Krabi', 'Phuket'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => onSelectRegion(reg)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-[#0E4D54] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Quick Amenity toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: 'All Amenities' },
              { id: 'Dedicated Workspace', label: 'Dedicated Desk' },
              { id: 'Pool', label: 'Pool' },
              { id: 'Gear Rinse Station', label: 'Gear Rinse' }
            ].map((am) => (
              <button
                key={am.id}
                type="button"
                onClick={() => onSelectAmenity(am.id)}
                className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedAmenity === am.id
                    ? 'bg-[#EADBCE] text-slate-900 border-[#D8C3AE] font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-[#FAF7F2]'
                }`}
              >
                {am.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Results Count & Sort Dropdown */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-slate-500 font-medium">
            <span className="font-semibold text-slate-900 font-mono">{totalResults}</span> stays evaluated
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onChangeSortBy(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-md px-2.5 py-1 text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="score">PAIR Qualitative Match</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Guest Rating</option>
              <option value="dive-proximity">Closest to Dive Pier</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
