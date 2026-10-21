import React, { useState, useEffect, useMemo, useCallback } from 'react';
import initialPropertiesData from './data/properties.json';
import { Property, PropertyEvidenceResult, DecomposedQuery, EvidenceCitation, Review, TradeOffVerdict } from './types';
import { decomposeQuery, filterAndScoreProperties, synthesizeTradeOffVerdict, PRESET_QUERIES } from './lib/evidenceEngine';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { FilterToolbar } from './components/FilterToolbar';
import { PropertyCard } from './components/PropertyCard';
import { TradeOffDrawer } from './components/TradeOffDrawer';
import { PinnedTrayBar } from './components/PinnedTrayBar';
import { QuoteInspectorModal } from './components/QuoteInspectorModal';
import { MetricsDrawer } from './components/MetricsDrawer';
import { CustomPropertyModal } from './components/CustomPropertyModal';
import { PairExplainer } from './components/PairExplainer';
import { Footer } from './components/Footer';

export default function App() {
  // Dataset state (seed properties + any user custom properties)
  const [properties, setProperties] = useState<Property[]>(initialPropertiesData as Property[]);

  // Search & Query Decomposition state
  const [currentQuery, setCurrentQuery] = useState<string>(
    "Quiet place in Krabi under $130 with fast Wi-Fi for Zoom & near dive shops"
  );
  const [decomposed, setDecomposed] = useState<DecomposedQuery | null>(null);
  const [isDecomposing, setIsDecomposing] = useState<boolean>(false);
  const [engineSource, setEngineSource] = useState<string>('Gemini 3.8 Flash');

  // UI Filter Toolbar state
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(200);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'price-asc' | 'price-desc' | 'rating' | 'dive-proximity'>('score');

  // Pinned Stays for Comparison (Max 3)
  const [pinnedIds, setPinnedIds] = useState<string[]>(['prop_krabi_01', 'prop_krabi_02']);
  const [isTradeOffOpen, setIsTradeOffOpen] = useState<boolean>(false);
  const [tradeOffVerdict, setTradeOffVerdict] = useState<TradeOffVerdict | null>(null);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState<boolean>(false);

  // Quote Inspector Modal
  const [selectedQuote, setSelectedQuote] = useState<{
    quote: EvidenceCitation;
    propertyTitle: string;
    fullReview?: Review;
  } | null>(null);

  // A/B Testing & Evaluation Drawer
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [abMode, setAbMode] = useState<'control' | 'variant'>('variant');

  // Custom Sandbox Property Modal
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Decompose query via server API with resilient heuristic fallback
  const handleExecuteSearch = useCallback(async (queryToRun: string) => {
    setCurrentQuery(queryToRun);
    setIsDecomposing(true);

    try {
      const response = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setDecomposed(data);
        setEngineSource(data.source || 'Gemini 3.8 Flash');
        if (data.hardFilters?.region) {
          setSelectedRegion(data.hardFilters.region);
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      // Resilient local fallback
      const localResult = decomposeQuery(queryToRun);
      setDecomposed(localResult);
      setEngineSource('Heuristic Semantic Engine');
      if (localResult.hardFilters.region) {
        setSelectedRegion(localResult.hardFilters.region);
      }
    } finally {
      setIsDecomposing(false);
    }
  }, []);

  // Initialize query on initial load
  useEffect(() => {
    handleExecuteSearch(currentQuery);
  }, []);

  // Synthesize Trade-off verdict when pinned stays change or user opens drawer
  const fetchTradeOffVerdict = useCallback(async () => {
    const pinnedProps = properties.filter((p) => pinnedIds.includes(p.id));
    if (pinnedProps.length === 0) {
      setTradeOffVerdict(null);
      return;
    }

    setIsLoadingVerdict(true);
    try {
      const response = await fetch('/api/tradeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: pinnedProps,
          query: currentQuery,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTradeOffVerdict(data);
      } else {
        throw new Error('Tradeoff API failed');
      }
    } catch (err) {
      // Resilient local fallback
      const localVerdict = await synthesizeTradeOffVerdict(pinnedProps, currentQuery);
      setTradeOffVerdict(localVerdict);
    } finally {
      setIsLoadingVerdict(false);
    }
  }, [pinnedIds, properties, currentQuery]);

  useEffect(() => {
    if (pinnedIds.length > 0) {
      fetchTradeOffVerdict();
    }
  }, [pinnedIds, properties]);

  // Handle Pin toggling
  const handleTogglePin = (propertyId: string) => {
    if (pinnedIds.includes(propertyId)) {
      setPinnedIds(pinnedIds.filter((id) => id !== propertyId));
    } else {
      if (pinnedIds.length >= 3) {
        return; // Max 3
      }
      setPinnedIds([...pinnedIds, propertyId]);
    }
  };

  const handleClearAllPins = () => {
    setPinnedIds([]);
    setTradeOffVerdict(null);
  };

  // Add custom property to sandbox
  const handleAddCustomProperty = (newProp: Property) => {
    setProperties([newProp, ...properties]);
    setPinnedIds([newProp.id, ...pinnedIds.slice(0, 2)]);
  };

  // Compute evaluated results
  const evaluatedResults: PropertyEvidenceResult[] = useMemo(() => {
    if (!decomposed) return [];
    
    // Evaluate properties against decomposed intent
    let results = filterAndScoreProperties(properties, decomposed);

    // Apply UI Toolbar filters if user manually changes region
    if (selectedRegion !== 'All') {
      results = results.filter(
        (r) =>
          r.property.region.toLowerCase() === selectedRegion.toLowerCase() ||
          r.property.location.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Apply Amenity filter
    if (selectedAmenity !== 'all') {
      results = results.filter((r) =>
        r.property.listedAmenities.some((a) =>
          a.toLowerCase().includes(selectedAmenity.toLowerCase())
        )
      );
    }

    // Sort results
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.property.pricePerNightUsd - b.property.pricePerNightUsd;
        case 'price-desc':
          return b.property.pricePerNightUsd - a.property.pricePerNightUsd;
        case 'rating':
          return b.property.rating - a.property.rating;
        case 'dive-proximity':
          return a.property.distanceToDiveCenterMins - b.property.distanceToDiveCenterMins;
        case 'score':
        default:
          return b.score - a.score;
      }
    });
  }, [properties, decomposed, selectedRegion, selectedAmenity, sortBy]);

  const pinnedPropertiesList = useMemo(() => {
    return properties.filter((p) => pinnedIds.includes(p.id));
  }, [properties, pinnedIds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1B242A]">
      {/* Top Bar */}
      <Header
        pinnedCount={pinnedIds.length}
        onOpenTradeOff={() => setIsTradeOffOpen(true)}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onResetSearch={() => handleExecuteSearch("Quiet place in Krabi under $130 with fast Wi-Fi for Zoom & near dive shops")}
      />

      {/* A/B Control Mode Notice Banner */}
      {abMode === 'control' && (
        <aside aria-label="Control Mode Notice" className="bg-amber-100/90 border-b border-amber-300 text-amber-900 px-4 py-2 text-xs flex items-center justify-between">
          <span>
            ⚠️ <strong>Control Mode Active:</strong> Simulating a legacy OTA with crude binary checkboxes and arbitrary match percentages. Verbatim review citations and trade-offs are suppressed.
          </span>
          <button
            onClick={() => setAbMode('variant')}
            className="underline font-semibold ml-2 hover:text-amber-950 cursor-pointer"
          >
            Switch to StayMatch Variant
          </button>
        </aside>
      )}

      {/* Hero Natural Language Search & Hybrid Intent Splitter */}
      <HeroSearch
        currentQuery={currentQuery}
        decomposed={decomposed}
        isLoading={isDecomposing}
        onSearch={handleExecuteSearch}
        onReset={() => handleExecuteSearch("Quiet place in Krabi under $130 with fast Wi-Fi for Zoom & near dive shops")}
        engineSource={engineSource}
      />

      {/* Toolbar */}
      <FilterToolbar
        totalResults={evaluatedResults.length}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        maxPrice={maxPriceFilter}
        onChangeMaxPrice={setMaxPriceFilter}
        selectedAmenity={selectedAmenity}
        onSelectAmenity={setSelectedAmenity}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        onResetFilters={() => {
          setSelectedRegion('All');
          setSelectedAmenity('all');
          setSortBy('score');
        }}
      />

      {/* Main Results Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
        {abMode === 'control' ? (
          /* Control Legacy View: Uninformative binary checkboxes */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluatedResults.map((result) => (
              <div
                key={result.property.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <img
                    src={result.property.heroImage}
                    alt={result.property.title}
                    className="w-full h-44 object-cover rounded-lg mb-3"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{result.property.location}</span>
                    <span className="font-bold text-amber-600">94% Match</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {result.property.title}
                  </h3>
                  <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2 mb-3">
                    <div>Wi-Fi: <strong className="text-emerald-700">Yes (Binary checkbox)</strong></div>
                    <div>Air Conditioning: <strong className="text-emerald-700">Yes</strong></div>
                    <div>Near Water: <strong className="text-emerald-700">Yes</strong></div>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    ⚠️ Review text is hidden in Control mode. Traveler cannot verify if Wi-Fi drops during video calls or if street bars play loud music.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    ${result.property.pricePerNightUsd} / nt
                  </span>
                  <button
                    onClick={() => setAbMode('variant')}
                    className="text-xs text-[#0E4D54] font-semibold underline cursor-pointer"
                  >
                    View PAIR Citations →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* StayMatch Variant: Citation-Backed Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluatedResults.map((result) => (
              <PropertyCard
                key={result.property.id}
                result={result}
                isPinned={pinnedIds.includes(result.property.id)}
                canPinMore={pinnedIds.length < 3}
                onTogglePin={handleTogglePin}
                onInspectQuote={(quote, title, fullReview) =>
                  setSelectedQuote({
                    quote,
                    propertyTitle: title,
                    fullReview,
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* PAIR Grounding Explainer Section */}
      <PairExplainer />

      {/* Clean Footer */}
      <Footer
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
      />

      {/* Persistent Bottom Pinned Drawer Bar */}
      <PinnedTrayBar
        pinnedProperties={pinnedPropertiesList}
        onOpenTradeOff={() => setIsTradeOffOpen(true)}
        onRemovePinned={handleTogglePin}
        onClearAll={handleClearAllPins}
      />

      {/* 3-Way Trade-Off Drawer Modal */}
      <TradeOffDrawer
        isOpen={isTradeOffOpen}
        onClose={() => setIsTradeOffOpen(false)}
        pinnedProperties={pinnedPropertiesList}
        onRemovePinned={handleTogglePin}
        tradeOffVerdict={tradeOffVerdict}
        isLoadingVerdict={isLoadingVerdict}
        onRefreshVerdict={fetchTradeOffVerdict}
      />

      {/* Verbatim Quote Inspector Modal */}
      <QuoteInspectorModal
        quote={selectedQuote?.quote || null}
        propertyTitle={selectedQuote?.propertyTitle || ''}
        fullReview={selectedQuote?.fullReview}
        onClose={() => setSelectedQuote(null)}
      />

      {/* A/B Metrics Drawer */}
      <MetricsDrawer
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
        abMode={abMode}
        onToggleAbMode={setAbMode}
      />

      {/* Custom Property Sandbox Modal */}
      <CustomPropertyModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        onAddProperty={handleAddCustomProperty}
      />
    </div>
  );
}
