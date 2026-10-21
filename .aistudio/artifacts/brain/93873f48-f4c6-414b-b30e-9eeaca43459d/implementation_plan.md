# StayMatch: Citation-Backed Semantic Travel Discovery & Trade-Off Engine

StayMatch eliminates the friction of 15+ open tabs and hundreds of unvetted guest reviews by decomposing natural language travel queries into deterministic filters and qualitative review signals, substantiating every recommendation with verifiable guest review citations and delivering a 3-way smart trade-off analysis.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following critical product and aesthetic directions were confirmed in Phase 1 clarification:
> - **AI & Synthesis Engine**: Powered by live Gemini API (`gemini-2.5-flash` / `gemini-3.8-flash`) through a secure server-side endpoint, paired with a deterministic heuristic fallback engine guaranteeing reliable response even during offline or zero-quota states.
> - **Visual Identity**: Warm Sandstone (`#FBF8F3` / `#F3EDE2`), Aegean/Teal (`#0E4D54` / `#166E77`), Warm Terracotta/Amber accents, refined luxury editorial typography (`Playfair Display` serif headlines, `Plus Jakarta Sans` body, and `tabular-nums` monospace pricing/latencies).
> - **Extended High-Impact Features Included**:
>   1. Direct quote highlight modal & review inspector with verified guest dates.
>   2. Scenario quick-chips (e.g., *"Krabi under $130 with 100+ Mbps fiber for Zoom"*, *"Quiet Phuket sanctuary near deep dive pier"*, *"Budget Railay solo retreat"*).
>   3. Interactive A/B Testing & Metrics Drawer demonstrating the OTA business impact (search abandonment drop, query-to-booking conversion, dwell time).
>   4. Custom Property & Review Sandbox Creator allowing users to add custom stays and test the engine in real time.

---

### 1. Overview & Core Concept

- **What It Does**: StayMatch shifts travel search from crude binary checkboxes (e.g. `Wi-Fi: Yes`, which fails to indicate if video calls disconnect) to an evidence-backed decision assistant. It parses compound natural language intents, scores properties against specific unstructured review testimonies, labels each signal according to Google PAIR design guidelines (`🟢 Verified by Guests`, `🟡 Mixed Feedback`, `⚪ Not Mentioned`), and synthesizes executive 3-way trade-off verdicts when comparing 2–3 properties.
- **Target Audience / Persona**: High-consideration travelers—remote workers taking daily Zoom standups, scuba divers needing early dawn boat proximity and gear rinse stations, light sleepers sensitive to bar music, and families balancing cliff stairs vs. direct pool access.
- **Key Value**: Replaces multi-tab chaos and review fatigue with a single high-trust verdict backed by clickable line-item citations.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Natural Language Search & Scenario Onboarding**:
   - The user lands on a warm, editorial discovery interface with a prominent semantic query bar and one-click scenario chips.
   - Submitting a query activates the **Hybrid Intent Splitter** visual breakdown, showing which constraints are handled deterministically (Region, Max Price, Amenities) and which are evaluated semantically from reviews (Noise at night, Wi-Fi stability, Dive pier commute).
2. **Citation-Backed Property Feed**:
   - Cards display high-res property visuals, night rates, verified overall ratings, and the **PAIR Evidence Matrix**: interactive proof pills mapping each query signal to exact verbatim quotes from past guests (`[rev_101 Liam K., 2026-08]`).
   - Clicking any quote pill opens the **Review Verification Popover**, spotlighting the exact paragraph in context with reviewer name and stay date.
3. **The 3-Way Trade-Off Pin Tray**:
   - Users click "Pin to Compare" on up to 3 listings. A persistent, elegant bottom drawer tracks pinned stays.
   - Opening the drawer presents an AI-generated **Executive Trade-Off Verdict**:
     - *Gains vs. Sacrifices*: Direct contrast (e.g., "Property A gives you 185 Mbps fiber Wi-Fi and absolute night quiet, but sacrifices beach walkability requiring a 15-min scooter ride").
     - *Persona Fit Matrix*: "Pick A if you take international video meetings; Pick B if you prioritize 3-min dive pier access over noise".
4. **Interactive A/B Testing & Metrics Dashboard**:
   - A dedicated slide-out drawer lets the user toggle between **Control (Standard OTA Checkbox Search)** and **Variant (StayMatch Citation Engine)** to see the user experience comparison alongside product conversion metrics.
5. **Custom Listing Sandbox**:
   - A modal to insert a new property with custom amenities and raw reviews to see how the engine decomposes and cites newly introduced data.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-end editorial travel journal, reminiscent of Condé Nast Traveler, Monocle, and Aman resorts.
- **Color Palette & Atmospheric Tokens**:
  - Neutral Canvas (60%): Sandstone Cream (`#FAF7F2`), Soft Warm Paper (`#F4EFE6`), Deep Slate Charcoal (`#1B242A`) for high contrast readability.
  - Structural Surfaces (30%): Pure Card White (`#FFFFFF`), Warm Sandstone Borders (`#E8DFD3`), Muted Card Backdrops (`#F9F6F0`).
  - Accent Budget (10%): Aegean Sea Teal (`#0E4D54` / `#166E77`) for primary CTAs and active states, Warm Coral/Amber (`#D97746`) for high-intent highlights.
- **Typography & Scale**:
  - Display / Hero: `Playfair Display` serif for refined editorial headings.
  - Body: `Plus Jakarta Sans` for clean legibility and structured UI elements.
  - Data / Figures: `font-mono tabular-nums` for prices, speeds, and time metrics.
- **Micro-Interactions**:
  - Gentle 150ms hover card elevation, smooth drawer slide-ups, animated tab switches, and quote highlight pulse without intrusive AI slop or flashing loaders.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: PAIR-Aligned Qualitative Proof Badges vs. Opaque Match Percentages**
  - *Chosen Approach*: Display status indicators (`🟢 Verified by Guests`, `🟡 Mixed Feedback`, `⚪ Not Mentioned`) directly linked to clickable review ID citations, strictly avoiding vague percentages like "94% Match".
  - *Why*: Google PAIR human-centered AI research demonstrates that numeric percentage scores create false confidence and user skepticism. Surfacing verbatim proof builds genuine traveler trust.
- **Decision 2: Hybrid Query Decomposition (Hard Filters + Review RAG)**
  - *Chosen Approach*: Deterministic constraints (Location, Price Cap, Guest Count) run as instant pre-filters, while qualitative nuances (Zoom reliability, night noise, morning boat departures) are evaluated across guest reviews via Gemini and semantic heuristics.
  - *Why*: Combining hard filters with review grounding avoids hallucinated booking logic while allowing deep qualitative discovery.
- **Decision 3: Server-Side Gemini API with Resilient Heuristic Fallback**
  - *Chosen Approach*: Server route `/api/decompose` and `/api/tradeoff` calls `@google/genai` on `gemini-3.8-flash` / `gemini-2.5-flash` using `GEMINI_API_KEY`. If the key is absent or network fails, an intelligent keyword and semantic heuristic engine instantly delivers complete citations and trade-offs.
  - *Why*: Unbreakable uptime during evaluation, instant responsiveness, and zero external dependency risk.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              StayMatch UI                              │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand Wordmark, Preset Queries, A/B Metrics, Sandbox) │
├────────────────────────────────────────────────────────────────────────┤
│  Natural Language Query Bar & Intent Splitter (Hard vs. Semantic Pills)│
├────────────────────────────────────────────────────────────────────────┤
│  Filter Strip (Budget slider, Location tab, Diver & Workcation presets)│
├──────────────────────────────────────┬─────────────────────────────────┤
│    Property Grid (PAIR Review Cites) │ Pinned Property Tray (Max 3)    │
│    • Photo & Amenities               │ • Quick comparison pill strip   │
│    • Status Badges with verbatim quote│ • "Synthesize Trade-Off" action │
│    • Pin to compare trigger          │                                 │
└──────────────────────────────────────┴─────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server API / Vite Engine Bridge                      │
│   • /api/query-decompose: Splits query into hard filters & review cues │
│   • /api/trade-off-verdict: Synthesizes Gains, Sacrifices, & Persona   │
│   • Fallback Heuristics: Zero-downtime offline matching logic         │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Seed Dataset
- **Properties Dataset**: 6 carefully crafted properties across Krabi (Klong Muang, Ao Nang, Railay) and Phuket (Chalong Pier, Rawai, Kata) featuring deliberate trade-offs (e.g., Baan Talay has 185 Mbps fiber + quiet cul-de-sac but is 15 mins from Ao Nang; Ao Nang Loft is 2 mins from dive shops but noisy at night with spotty Wi-Fi; Railay Bungalow is serene but has no dedicated desk; Chalong Pier Sanctuary is diver paradise but lacks a swimming beach).
- **Interactive State Store**:
  - `query`: Active text search string.
  - `intent`: Decomposed filters (`region`, `maxPrice`, `signals: [{ cue, category, matchedReviews }]`).
  - `pinnedStays`: Array of up to 3 selected properties.
  - `tradeOffAnalysis`: Executive verdict, gains/losses comparison table, and recommendation tags.
  - `abTestMode`: Toggle between Control (standard OTA) and Variant (StayMatch).
  - `selectedQuoteModal`: Target quote object for detailed in-context inspection.
