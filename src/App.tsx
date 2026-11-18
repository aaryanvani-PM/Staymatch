import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import initialPropertiesData from './data/properties.json';
import { Property, PropertyEvidenceResult, DecomposedQuery, EvidenceCitation, Review, TradeOffVerdict } from './types';
import { decomposeQuery, filterAndScoreProperties, synthesizeEditorialVerdictSync, compareByMatchThenScore, DEFAULT_QUERY } from './lib/evidenceEngine';
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

const PRICE_SLIDER_MAX = 300;

export default function App() {
  // Dataset state (seed properties + any user custom properties)
  const [properties, setProperties] = useState<Property[]>(initialPropertiesData as Property[]);

  // Search & Query Decomposition state
  const [currentQuery, setCurrentQuery] = useState<string>(DEFAULT_QUERY);
  const [decomposed, setDecomposed] = useState<DecomposedQuery | null>(null);
  const [isDecomposing, setIsDecomposing] = useState<boolean>(false);
  const [engineSource, setEngineSource] = useState<string>('');

  // UI Filter Toolbar state
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(PRICE_SLIDER_MAX);
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

  // Ignore responses from searches that have since been superseded.
  const searchSeq = useRef(0);
  const verdictSeq = useRef(0);

  const applyDecomposition = (result: DecomposedQuery, source: string) => {
    setDecomposed(result);
    setEngineSource(source);
    // Follow the query's region; a query without one clears a region left over from a previous search.
    setSelectedRegion(result.hardFilters.region || 'All');
  };

  // Decompose query via server API with resilient heuristic fallback
  const handleExecuteSearch = useCallback(async (queryToRun: string) => {
    const trimmed = queryToRun.trim();
    if (!trimmed) return;
    const seq = ++searchSeq.current;
    setCurrentQuery(trimmed);
    setIsDecomposing(true);

    try {
      const response = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!response.ok) throw new Error(`Decompose API returned ${response.status}`);
      const data = await response.json();
      if (seq !== searchSeq.current) return;
      applyDecomposition(data, data.source || 'Server');
    } catch {
      if (seq !== searchSeq.current) return;
      // Server unreachable: run the same rule-based engine in the browser.
      applyDecomposition(decomposeQuery(trimmed), 'Rule-Based Engine (offline)');
    } finally {
      if (seq === searchSeq.current) setIsDecomposing(false);
    }
  }, []);

  // Initialize query on initial load
  useEffect(() => {
    handleExecuteSearch(currentQuery);
  }, []);

  // Synthesize the trade-off verdict for the pinned stays (in pin order).
  const fetchTradeOffVerdict = useCallback(async () => {
    const pinnedProps = pinnedIds
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is Property => Boolean(p));
    const seq = ++verdictSeq.current;
    if (pinnedProps.length === 0) {
      setTradeOffVerdict(null);
      setIsLoadingVerdict(false);
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

      if (!response.ok) throw new Error(`Trade-off API returned ${response.status}`);
      const data = await response.json();
      if (seq === verdictSeq.current) setTradeOffVerdict(data);
    } catch {
      // Server unreachable: synthesize locally instead of retrying the same endpoint.
      if (seq === verdictSeq.current) setTradeOffVerdict(synthesizeEditorialVerdictSync(pinnedProps, currentQuery));
    } finally {
      if (seq === verdictSeq.current) setIsLoadingVerdict(false);
    }
  }, [pinnedIds, properties, currentQuery]);

  // Only spend a model call when the drawer is actually open; refresh if pins or the query change while it is.
  useEffect(() => {
    if (isTradeOffOpen) fetchTradeOffVerdict();
  }, [isTradeOffOpen, fetchTradeOffVerdict]);

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
    verdictSeq.current++;
    setPinnedIds([]);
    setTradeOffVerdict(null);
    setIsLoadingVerdict(false);
  };

  // Add custom property to sandbox
  const handleAddCustomProperty = (newProp: Property) => {
    setProperties((prev) => [newProp, ...prev]);
    setPinnedIds((prev) => [newProp.id, ...prev.slice(0, 2)]);
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

    // Apply price slider (the top of the range means "any price")
    if (maxPriceFilter < PRICE_SLIDER_MAX) {
      results = results.filter((r) => r.property.pricePerNightUsd <= maxPriceFilter);
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
          return compareByMatchThenScore(a, b);
      }
    });
  }, [properties, decomposed, selectedRegion, maxPriceFilter, selectedAmenity, sortBy]);

  const pinnedPropertiesList = useMemo(() => {
    return pinnedIds
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is Property => Boolean(p));
  }, [properties, pinnedIds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1B242A]">
      {/* Top Bar */}
      <Header
        pinnedCount={pinnedIds.length}
        onOpenTradeOff={() => setIsTradeOffOpen(true)}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onResetSearch={() => handleExecuteSearch(DEFAULT_QUERY)}
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
        onReset={() => handleExecuteSearch(DEFAULT_QUERY)}
        engineSource={engineSource}
      />

      {/* Toolbar */}
      <FilterToolbar
        totalResults={evaluatedResults.length}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        maxPrice={maxPriceFilter}
        onChangeMaxPrice={setMaxPriceFilter}
        priceSliderMax={PRICE_SLIDER_MAX}
        selectedAmenity={selectedAmenity}
        onSelectAmenity={setSelectedAmenity}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        onResetFilters={() => {
          setSelectedRegion('All');
          setMaxPriceFilter(PRICE_SLIDER_MAX);
          setSelectedAmenity('all');
          setSortBy('score');
        }}
      />

      {/* Main Results Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
        {decomposed && evaluatedResults.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-[#D8C3AE] rounded-2xl">
            <h3 className="font-serif text-lg font-semibold text-slate-800">No stays match these filters</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try widening the price limit, switching region, or clearing the amenity filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('All');
                setMaxPriceFilter(PRICE_SLIDER_MAX);
                setSelectedAmenity('all');
              }}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#0E4D54] text-white hover:bg-[#0B3D43] cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : abMode === 'control' ? (
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
