import React, { useState } from 'react';
import { X, Plus, Trash2, Home, Check } from 'lucide-react';
import { Property, Review } from '../types';

interface CustomPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (newProperty: Property) => void;
}

export const CustomPropertyModal: React.FC<CustomPropertyModalProps> = ({
  isOpen,
  onClose,
  onAddProperty
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('Krabi');
  const [price, setPrice] = useState('95');
  const [diveDistance, setDiveDistance] = useState('5');
  const [amenities, setAmenities] = useState('High-Speed Wi-Fi, Dedicated Workspace, Pool, Air Conditioning');
  const [tagline, setTagline] = useState('Modern boutique villa with fiber internet and quiet garden patio');
  
  const [reviews, setReviews] = useState<Array<{ author: string; date: string; text: string }>>([
    {
      author: 'Jordan T.',
      date: '2026-09',
      text: 'Fiber Wi-Fi reached 160 Mbps and never cut out on Zoom. Very peaceful at night, though the hill walk is a good workout.'
    },
    {
      author: 'Clara S.',
      date: '2026-08',
      text: 'Only 5 minutes walk down to the dive shop. Clean room with cold AC and a proper desk for my laptop.'
    }
  ]);

  if (!isOpen) return null;

  const handleAddReviewRow = () => {
    setReviews([
      ...reviews,
      { author: 'Guest', date: '2026-09', text: 'Loved the quiet atmosphere, Wi-Fi was stable throughout.' }
    ]);
  };

  const handleRemoveReviewRow = (idx: number) => {
    setReviews(reviews.filter((_, i) => i !== idx));
  };

  const handleReviewChange = (idx: number, field: string, val: string) => {
    const updated = [...reviews];
    updated[idx] = { ...updated[idx], [field]: val };
    setReviews(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    const propertyId = `prop_custom_${Date.now()}`;
    const parsedPrice = parseInt(price, 10) || 100;
    const parsedDive = parseInt(diveDistance, 10) || 5;

    const finalReviews: Review[] = reviews.map((r, i) => ({
      id: `rev_custom_${i + 1}`,
      author: r.author || 'Guest',
      date: r.date || '2026-09',
      text: r.text
    }));

    const newProperty: Property = {
      id: propertyId,
      title,
      location,
      region,
      pricePerNightUsd: parsedPrice,
      rating: 4.88,
      reviewCount: finalReviews.length + 42,
      distanceToDiveCenterMins: parsedDive,
      tagline,
      listedAmenities: amenities.split(',').map(s => s.trim()).filter(Boolean),
      heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      verifiedHighlights: {
        wifiSpeedMbps: 160,
        deskAvailable: true,
        nightNoiseLevel: 'dead quiet',
        divePierWalkMins: parsedDive
      },
      reviews: finalReviews
    };

    onAddProperty(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D8C3AE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E8DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E4D54]/10 text-[#0E4D54] flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Add Custom Property to Sandbox
              </h2>
              <p className="text-xs text-slate-500">
                Test how the engine decomposes and grounds citations against new unstructured reviews.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Andaman Coral & Fiber Retreat"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none focus:ring-1 focus:ring-[#0E4D54]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tubkaek Beach, Krabi"
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none focus:ring-1 focus:ring-[#0E4D54]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none"
              >
                <option value="Krabi">Krabi</option>
                <option value="Phuket">Phuket</option>
                <option value="Koh Samui">Koh Samui</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Price/Night (USD)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dive Center (Mins)
              </label>
              <input
                type="number"
                value={diveDistance}
                onChange={(e) => setDiveDistance(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Short Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Listed Amenities (comma separated)
            </label>
            <input
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#D8C3AE] focus:outline-none"
            />
          </div>

          {/* Raw Reviews to Ground Against */}
          <div className="border-t border-[#E8DFD3] pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-serif text-sm font-bold text-slate-900 block">
                Planted Guest Reviews (For Semantic Citing)
              </label>
              <button
                type="button"
                onClick={handleAddReviewRow}
                className="text-xs text-[#0E4D54] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Review
              </button>
            </div>

            <div className="space-y-2.5">
              {reviews.map((rev, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-[#E8DFD3] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Author name"
                        value={rev.author}
                        onChange={(e) => handleReviewChange(idx, 'author', e.target.value)}
                        className="px-2 py-1 bg-[#FAF7F2] rounded border border-slate-200 text-xs w-32"
                      />
                      <input
                        type="text"
                        placeholder="Date (YYYY-MM)"
                        value={rev.date}
                        onChange={(e) => handleReviewChange(idx, 'date', e.target.value)}
                        className="px-2 py-1 bg-[#FAF7F2] rounded border border-slate-200 text-xs w-28 font-mono"
                      />
                    </div>
                    {reviews.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReviewRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={rev.text}
                    placeholder="Review text detailing Wi-Fi speeds, noise, dive proximity, etc."
                    onChange={(e) => handleReviewChange(idx, 'text', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] rounded border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D8C3AE] rounded-lg text-slate-700 hover:bg-[#F5EFE6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0E4D54] hover:bg-[#146B75] text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Add Property & Re-evaluate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
