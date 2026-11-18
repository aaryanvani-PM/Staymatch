import type { Property, Review, EvidenceCitation, PropertyEvidenceResult, DecomposedQuery, TradeOffVerdict } from '../types';
import { CURATED_COPY } from './editorialCopy.ts';

export const PRESET_QUERIES = [
  {
    label: "Work & Dive in Krabi",
    query: "Quiet place in Krabi under $130 with fast Wi-Fi for Zoom & near dive shops",
    category: "Remote Work + Diving"
  },
  {
    label: "Phuket Pier-Proximity Diver",
    query: "Phuket stay under $100 walking distance to dive boat pier with quiet sleep",
    category: "Scuba Diver"
  },
  {
    label: "Budget Railay Solo Retreat",
    query: "Krabi under $100 surrounded by limestone nature with reliable internet for email",
    category: "Relaxation"
  },
  {
    label: "High-Bandwidth Executive Stay",
    query: "Dedicated workspace with 200+ Mbps fiber and dual monitors in Phuket",
    category: "Executive Tech"
  }
];

export const DEFAULT_QUERY = PRESET_QUERIES[0].query;

// Canonical signal labels. The Gemini decomposer may phrase signals differently;
// classifySignal() maps any phrasing back onto one of these categories.
export const SIGNALS = {
  wifi: "Fast & Reliable Wi-Fi for Video Calls / Zoom",
  noise: "Quiet Environment for Night Sleep & Focus",
  diving: "Scuba Dive Logistics (Pier / Shops / Gear Proximity)",
  location: "Beachfront Walkability & Sea Access",
  workspace: "Ergonomic Workstation Setup",
} as const;

// ---------------------------------------------------------------------------
// Text matching helpers
// ---------------------------------------------------------------------------

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termRegexCache = new Map<string, RegExp>();
function termRegex(term: string): RegExp {
  let re = termRegexCache.get(term);
  if (!re) {
    // Word boundaries stop "bar" matching "barely" and "sea" matching "season".
    re = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}(?=$|[^a-z0-9])`, 'gi');
    termRegexCache.set(term, re);
  }
  re.lastIndex = 0;
  return re;
}

const NEGATORS = new Set(['no', 'not', 'never', 'without', 'zero', "didn't", 'didnt', "don't", 'dont', "doesn't", 'doesnt', "wasn't", 'wasnt', "isn't", 'isnt', 'nor', 'hardly']);

/** True if `term` appears as a whole word/phrase in `text`. */
export function mentions(text: string, term: string): boolean {
  return termRegex(term).test(text);
}

/**
 * True if `term` appears and is not negated by one of the four preceding words
 * ("never cut out", "no loud music", "zero packet loss or lag").
 */
export function mentionsAffirmed(text: string, term: string): boolean {
  const re = termRegex(term);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(0, m.index + m[1].length).toLowerCase();
    const prevWords = before.split(/[^a-z0-9']+/).filter(Boolean).slice(-4);
    if (!prevWords.some(w => NEGATORS.has(w))) return true;
  }
  return false;
}

const anyMention = (text: string, terms: string[]) => terms.some(t => mentions(text, t));
const anyAffirmed = (text: string, terms: string[]) => terms.some(t => mentionsAffirmed(text, t));

/** Largest "N Mbps" figure quoted in a piece of text, if any. */
export function extractMbps(text: string): number | undefined {
  const nums = [...text.matchAll(/(\d{1,4})\s*(?:mbps|mb\/s|megabits)/gi)].map(m => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) : undefined;
}

// ---------------------------------------------------------------------------
// Query decomposition (rule-based fallback for when Gemini is unavailable)
// ---------------------------------------------------------------------------

const REGION_ALIASES: Record<string, string[]> = {
  Krabi: ['krabi', 'ao nang', 'klong muang', 'railay', 'tonsai', 'ton sai'],
  Phuket: ['phuket', 'chalong', 'rawai', 'kata', 'karon', 'nai harn', 'patong'],
};

const toNumber = (s: string) => parseInt(s.replace(/,/g, ''), 10);

/** Extracts a nightly budget cap from phrasing like "under $130", "max 150", "$80-120", "$300 a night". */
export function parseMaxPrice(q: string): number | undefined {
  const num = String.raw`\$?\s*(\d[\d,]*)`;
  const capPatterns = [
    new RegExp(String.raw`(?:under|below|less than|cheaper than|no more than|up to|at most|max(?:imum)?|budget(?:\s+of)?|<=?|≤)\s*(?:usd\s*)?${num}`, 'i'),
    new RegExp(String.raw`${num}\s*(?:usd\s*)?(?:max|maximum|or less|or under|and under|tops)`, 'i'),
  ];
  for (const re of capPatterns) {
    const m = q.match(re);
    if (m) return toNumber(m[1]);
  }
  // Ranges: "$80-120", "between 80 and 150", "$80 to $150"
  const range = q.match(/\$\s*(\d[\d,]*)\s*(?:-|–|to)\s*\$?\s*(\d[\d,]*)/i)
    || q.match(/between\s*\$?\s*(\d[\d,]*)\s*and\s*\$?\s*(\d[\d,]*)/i);
  if (range) return Math.max(toNumber(range[1]), toNumber(range[2]));
  // A bare "$300" or "300 a night" reads as a budget.
  const bare = q.match(/\$\s*(\d[\d,]*)/) || q.match(/(\d[\d,]*)\s*(?:usd|dollars)?\s*(?:a|per|\/)\s*night/i);
  if (bare) return toNumber(bare[1]);
  return undefined;
}

const AMENITY_TERMS: Array<{ amenity: string; terms: string[] }> = [
  { amenity: 'Pool', terms: ['pool', 'swimming pool', 'plunge pool'] },
  { amenity: 'Dedicated Workspace', terms: ['workspace', 'desk', 'work desk', 'office chair'] },
  { amenity: 'Parking', terms: ['parking'] },
  { amenity: 'Kitchen', terms: ['kitchen', 'kitchenette'] },
  { amenity: 'Gym', terms: ['gym', 'fitness'] },
  { amenity: 'Breakfast', terms: ['breakfast'] },
  { amenity: 'Gear Rinse', terms: ['rinse', 'rinse station', 'rinse tank'] },
];

export function decomposeQuery(rawQuery: string): DecomposedQuery {
  const q = rawQuery.toLowerCase();

  // 1. Region
  let region: string | undefined;
  for (const [name, aliases] of Object.entries(REGION_ALIASES)) {
    if (anyMention(q, aliases)) { region = name; break; }
  }

  // 2. Budget
  const maxPrice = parseMaxPrice(q);

  // 3. Explicit amenities (skipping negated ones like "no pool needed")
  const requiredAmenities = AMENITY_TERMS
    .filter(({ terms }) => anyAffirmed(q, terms))
    .map(({ amenity }) => amenity);

  // 4. Qualitative signals to ground in reviews
  const semanticSignals: string[] = [];
  if (anyMention(q, ['wifi', 'wi-fi', 'zoom', 'video call', 'video calls', 'calls', 'internet', 'fiber', 'fibre', 'mbps', 'bandwidth', 'remote work', 'work remotely'])) {
    semanticSignals.push(SIGNALS.wifi);
  }
  if (anyMention(q, ['quiet', 'noise', 'noisy', 'sleep', 'silent', 'peaceful', 'peace', 'calm', 'tranquil', 'light sleeper'])) {
    semanticSignals.push(SIGNALS.noise);
  }
  if (anyMention(q, ['dive', 'dives', 'diving', 'diver', 'divers', 'scuba', 'pier', 'dive boat', 'boats', 'padi', 'snorkel', 'snorkeling', 'snorkelling'])) {
    semanticSignals.push(SIGNALS.diving);
  }
  if (anyMention(q, ['beach', 'beachfront', 'ocean', 'sand', 'surf', 'surfing', 'sea view', 'walkable', 'walking distance', 'nature', 'limestone'])) {
    semanticSignals.push(SIGNALS.location);
  }
  if (anyMention(q, ['chair', 'monitor', 'monitors', 'cowork', 'co-work', 'coworking', 'co-working', 'workstation', 'ergonomic', 'desk', 'workspace'])) {
    semanticSignals.push(SIGNALS.workspace);
  }

  // A generic query gets the three signals this catalog is built around.
  if (semanticSignals.length === 0) {
    semanticSignals.push(SIGNALS.wifi, SIGNALS.noise, SIGNALS.diving);
  }

  const has = (cat: SignalCategory) => semanticSignals.some(s => classifySignal(s) === cat);
  let detectedVibe = "Balanced Coastal Workcation & Discovery";
  if (has('wifi') && has('noise')) detectedVibe = "Deep Focus Workcation & Uninterrupted Rest";
  else if (has('wifi') && has('diving')) detectedVibe = "High-Productivity Workcation & Scuba Sanctuary";
  else if (has('workspace') && has('wifi')) detectedVibe = "Executive Bandwidth & Focused Work Setup";
  else if (has('diving')) detectedVibe = "Early Dawn Dive Expedition & Pier Proximity";
  else if (anyMention(q, ['nature', 'limestone', 'railay', 'unplug'])) detectedVibe = "Car-Free Limestone Solitude & Natural Rejuvenation";
  else if (has('location')) detectedVibe = "Barefoot Beach Days & Easy Walkability";
  else if (has('noise')) detectedVibe = "Restorative Quiet & Slow Mornings";

  let userIntentSummary = `Looking for ${region ?? 'Andaman coast'} stays`;
  if (maxPrice) userIntentSummary += ` capped at $${maxPrice}/night`;
  if (requiredAmenities.length) userIntentSummary += ` with ${requiredAmenities.join(', ')}`;
  userIntentSummary += `, checking review evidence for ${semanticSignals.length} qualitative requirement${semanticSignals.length === 1 ? '' : 's'}.`;

  return {
    rawQuery,
    hardFilters: { region, maxPrice, requiredAmenities },
    semanticSignals,
    userIntentSummary,
    detectedVibe
  };
}

// ---------------------------------------------------------------------------
// Review evidence grounding
// ---------------------------------------------------------------------------

export type SignalCategory = EvidenceCitation['category'];

/** Maps any signal phrasing (canonical or model-generated) onto a category. */
export function classifySignal(signal: string): SignalCategory {
  const s = signal.toLowerCase();
  if (anyMention(s, ['wi-fi', 'wifi', 'zoom', 'internet', 'bandwidth', 'fiber', 'fibre', 'connection', 'video calls', 'video call', 'mbps'])) return 'wifi';
  if (anyMention(s, ['quiet', 'noise', 'sleep', 'silent', 'peaceful', 'calm'])) return 'noise';
  if (anyMention(s, ['dive', 'diving', 'scuba', 'pier', 'padi', 'snorkel', 'snorkeling'])) return 'diving';
  if (anyMention(s, ['workstation', 'workspace', 'ergonomic', 'monitor', 'monitors', 'desk', 'chair', 'co-working', 'coworking'])) return 'workspace';
  if (anyMention(s, ['beach', 'sea', 'walk', 'walkable', 'walkability', 'location', 'nature', 'surf'])) return 'location';
  return 'general';
}

const WIFI_TERMS = ['wi-fi', 'wifi', 'internet', 'fiber', 'fibre', 'connection', 'router', 'mbps'];
const WIFI_NEGATIVE = ['dropped', 'drops', 'drop out', 'lag', 'lags', 'lagged', 'laggy', 'struggled', 'struggles', 'cut out', 'cuts out', 'spotty', 'patchy', 'unreliable', 'slow', 'froze', 'freezes', 'packet loss', 'disconnects', 'throttles'];
const WIFI_POSITIVE = ['fast', 'fastest', 'stable', 'reliable', 'zoom marathon', 'zoom marathons', 'product calls', 'sprint review', 'symmetric'];

const NOISE_NEGATIVE = ['bar', 'bars', 'club', 'nightclub', 'bass', 'music', 'loud', 'noisy', 'party', 'parties', 'karaoke', 'street chatter', 'chatter', 'traffic noise', 'thin walls', 'construction', 'roosters', 'rooster', 'do not book this if you need to'];
const NOISE_POSITIVE = ['dead quiet', 'super quiet', 'very quiet', 'quiet', 'peaceful', 'silent', 'cul-de-sac', 'zero cars', 'double-glazed', 'total peace', 'only to birds', 'bird songs'];

const DIVE_TERMS = ['dive', 'diving', 'divers', 'scuba', 'padi', 'pier', 'longtail', 'rinse tank', 'boat departures', 'day boats', 'boat trips', 'dive shop', 'dive center'];

const WORKSPACE_NEGATIVE = ['no proper desk', 'no desk', 'low coffee table', 'no chair', 'uncomfortable chair', 'nowhere to work'];
const WORKSPACE_POSITIVE = ['desk', 'proper desk', 'ergonomic', 'chair', 'monitor', 'monitors', 'study', 'co-working', 'coworking', 'co-working lounge', 'workspace'];

const LOCATION_TERMS = ['beach', 'sea', 'sea arches', 'sand', 'waves', 'walk', 'walking', 'boardwalk', 'scooter', 'cul-de-sac', 'cliffs', 'views'];

function cite(signal: string, category: SignalCategory, status: EvidenceCitation['status'], headlineSummary: string, review?: Review): EvidenceCitation {
  const statusLabel = status === 'verified' ? 'Verified by Guests' : status === 'mixed' ? 'Mixed Feedback' : 'Not Mentioned in Reviews';
  return {
    signalQuery: signal,
    category,
    status,
    statusLabel,
    headlineSummary,
    ...(review ? { verbatimQuote: review.text, reviewId: review.id, author: review.author, reviewDate: review.date } : {})
  };
}

function evaluateWifi(signal: string, property: Property, reviews: Review[]): EvidenceCitation {
  const wifiReviews = reviews.filter(r => anyMention(r.text, WIFI_TERMS));
  const negative = wifiReviews.find(r => anyAffirmed(r.text, WIFI_NEGATIVE));
  const quoted = wifiReviews
    .map(r => ({ r, mbps: extractMbps(r.text) }))
    .filter((x): x is { r: Review; mbps: number } => x.mbps !== undefined)
    .sort((a, b) => b.mbps - a.mbps)[0];
  const positive = (quoted && quoted.mbps >= 50 ? quoted.r : undefined)
    ?? wifiReviews.find(r => anyAffirmed(r.text, WIFI_POSITIVE) && r !== negative);

  if (negative && positive && positive !== negative) {
    return cite(signal, 'wifi', 'mixed', 'Good speeds reported, but other guests saw drop-offs', negative);
  }
  if (negative) {
    const speed = quoted ? ` (~${quoted.mbps} Mbps)` : '';
    return cite(signal, 'wifi', 'mixed', `Guests report drops or lag on calls${speed}`, negative);
  }
  if (positive) {
    const mbps = quoted?.mbps ?? property.verifiedHighlights.wifiSpeedMbps;
    return cite(signal, 'wifi', 'verified', mbps ? `Guests measured ~${mbps} Mbps and stable video calls` : 'Guests report stable video calls', positive);
  }
  if (quoted) {
    return cite(signal, 'wifi', 'mixed', `Around ${quoted.mbps} Mbps: fine for email, marginal for video calls`, quoted.r);
  }
  if (wifiReviews[0]) {
    return cite(signal, 'wifi', 'mixed', 'Wi-Fi mentioned, but no guest confirms it handles video calls', wifiReviews[0]);
  }
  return cite(signal, 'wifi', 'unmentioned', 'No guest reviews confirm video-call bandwidth');
}

function evaluateNoise(signal: string, reviews: Review[]): EvidenceCitation {
  const noisy = reviews.find(r => anyAffirmed(r.text, NOISE_NEGATIVE));
  const quiet = reviews.find(r => anyAffirmed(r.text, NOISE_POSITIVE));
  if (noisy) return cite(signal, 'noise', 'mixed', 'Guests mention music, bars or street noise at night', noisy);
  if (quiet) return cite(signal, 'noise', 'verified', 'Guests describe quiet nights', quiet);
  return cite(signal, 'noise', 'unmentioned', 'Night-time noise is not mentioned in available reviews');
}

function evaluateDiving(signal: string, property: Property, reviews: Review[]): EvidenceCitation {
  const mins = property.distanceToDiveCenterMins;
  const diveRev = reviews.find(r => anyMention(r.text, DIVE_TERMS));
  if (mins > 10) {
    const farRev = reviews.find(r => anyMention(r.text, ['taxi', 'commute', 'drive', 'grab'])) ?? diveRev;
    return cite(signal, 'diving', 'mixed', `~${mins} min each way to the dive boats`, farRev);
  }
  if (diveRev) return cite(signal, 'diving', 'verified', `${mins} min to the dive pier or dive center`, diveRev);
  return cite(signal, 'diving', 'unmentioned', 'Reviews do not mention dive shops or boat departures');
}

function evaluateWorkspace(signal: string, reviews: Review[]): EvidenceCitation {
  const noDesk = reviews.find(r => anyMention(r.text, WORKSPACE_NEGATIVE));
  if (noDesk) return cite(signal, 'workspace', 'mixed', 'No proper desk; guests worked from lounge furniture', noDesk);
  const desk = reviews.find(r => anyAffirmed(r.text, WORKSPACE_POSITIVE));
  if (desk) return cite(signal, 'workspace', 'verified', 'Guests confirm a real desk, chair or monitor setup', desk);
  return cite(signal, 'workspace', 'unmentioned', 'No guest mentions a laptop desk setup');
}

function evaluateLocation(signal: string, reviews: Review[]): EvidenceCitation {
  const rev = reviews.find(r => anyMention(r.text, LOCATION_TERMS));
  if (rev) return cite(signal, 'location', 'verified', 'Setting and access described in guest reviews', rev);
  return cite(signal, 'location', 'unmentioned', 'No guest mentions found for this criterion');
}

/** Grounds each requested signal in the property's reviews. */
export function evaluatePropertyAgainstReviewSignals(property: Property, signals: string[]): EvidenceCitation[] {
  const reviews = property.reviews || [];
  return signals.map(signal => {
    switch (classifySignal(signal)) {
      case 'wifi': return evaluateWifi(signal, property, reviews);
      case 'noise': return evaluateNoise(signal, reviews);
      case 'diving': return evaluateDiving(signal, property, reviews);
      case 'workspace': return evaluateWorkspace(signal, reviews);
      default: return evaluateLocation(signal, reviews);
    }
  });
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Loose amenity match: "Pool" matches "Infinity Pool", "Kitchen" matches "Kitchenette", "Parking" matches "Free Parking". */
export function hasAmenity(property: Property, amenity: string): boolean {
  const want = amenity.toLowerCase();
  const synonyms: Record<string, string[]> = {
    'dedicated workspace': ['workspace', 'desk', 'co-working'],
    'gear rinse': ['rinse'],
  };
  const needles = synonyms[want] ?? [want];
  return property.listedAmenities.some(a => needles.some(n => a.toLowerCase().includes(n)));
}

function regionMatches(property: Property, region: string): boolean {
  const r = region.toLowerCase();
  return property.region.toLowerCase() === r || property.location.toLowerCase().includes(r);
}

function deriveTradeOffNote(property: Property, badges: EvidenceCitation[]): string {
  const good = badges.find(b => b.status === 'verified');
  const bad = badges.find(b => b.status === 'mixed') ?? badges.find(b => b.status === 'unmentioned');
  if (good && bad) return `${good.headlineSummary}, but ${bad.headlineSummary.charAt(0).toLowerCase()}${bad.headlineSummary.slice(1)}.`;
  if (good) return `${good.headlineSummary}; no review red flags for your criteria.`;
  if (bad) return `${bad.headlineSummary}.`;
  return property.tagline;
}

export function filterAndScoreProperties(properties: Property[], decomposed: DecomposedQuery): PropertyEvidenceResult[] {
  const { hardFilters, semanticSignals } = decomposed;

  return properties.map(property => {
    const hardFilterReasons: string[] = [];

    if (hardFilters.region && !regionMatches(property, hardFilters.region)) {
      hardFilterReasons.push(`Located in ${property.region}, not ${hardFilters.region}`);
    }
    if (hardFilters.maxPrice && property.pricePerNightUsd > hardFilters.maxPrice) {
      hardFilterReasons.push(`$${property.pricePerNightUsd}/night exceeds budget of $${hardFilters.maxPrice}`);
    }
    if (hardFilters.minRating && property.rating < hardFilters.minRating) {
      hardFilterReasons.push(`Rated ${property.rating}, below ${hardFilters.minRating}`);
    }
    for (const req of hardFilters.requiredAmenities ?? []) {
      if (!hasAmenity(property, req)) hardFilterReasons.push(`Missing listed amenity: ${req}`);
    }
    const hardFilterMatch = hardFilterReasons.length === 0;

    const evidenceBadges = evaluatePropertyAgainstReviewSignals(property, semanticSignals);

    // Rating sets the baseline (~70); each verified signal adds, each mixed one subtracts.
    let score = property.rating * 15;
    for (const badge of evidenceBadges) {
      if (badge.status === 'verified') score += 10;
      else if (badge.status === 'mixed') score -= 5;
    }
    if (!hardFilterMatch) score -= 30;

    const strengths: string[] = [];
    const mbps = property.verifiedHighlights.wifiSpeedMbps;
    if (mbps && mbps >= 100) strengths.push(`${mbps} Mbps Fiber Wi-Fi`);
    if (property.verifiedHighlights.nightNoiseLevel === 'dead quiet') strengths.push("Quiet at night");
    if (property.distanceToDiveCenterMins <= 5) strengths.push(`${property.distanceToDiveCenterMins} min to dive boats`);
    if (hasAmenity(property, 'Dedicated Workspace')) strengths.push("Dedicated workspace");

    const curated = CURATED_COPY[property.id];

    return {
      property,
      hardFilterMatch,
      hardFilterReasons,
      evidenceBadges,
      score: Math.max(20, Math.min(99, Math.round(score))),
      strengths,
      tradeOffNote: curated?.tradeOffNote ?? deriveTradeOffNote(property, evidenceBadges),
      vibeAtmosphere: curated?.cardVibe ?? property.vibeAtmosphere ?? property.tagline,
      travelerFeeling: curated?.cardFeeling ?? property.travelerFeeling ?? "Relaxed, unhurried, and close to the water."
    };
  }).sort(compareByMatchThenScore);
}

/** Properties that pass every hard filter come first; ties broken by score. */
export function compareByMatchThenScore(a: PropertyEvidenceResult, b: PropertyEvidenceResult): number {
  if (a.hardFilterMatch !== b.hardFilterMatch) return a.hardFilterMatch ? -1 : 1;
  return b.score - a.score;
}

// ---------------------------------------------------------------------------
// Trade-off synthesis (rule-based fallback for when Gemini is unavailable)
// ---------------------------------------------------------------------------

function wifiLine(p: Property): string {
  const mbps = p.verifiedHighlights.wifiSpeedMbps;
  const wifi = evaluateWifi(SIGNALS.wifi, p, p.reviews || []);
  const who = wifi.author ? ` — ${wifi.author}` : '';
  if (wifi.status === 'mixed') return `🟡 ${mbps ? `${mbps} Mbps, ` : ''}${wifi.headlineSummary.toLowerCase()}${who}`;
  if (!mbps) return wifi.status === 'verified' ? `🟢 ${wifi.headlineSummary}${who}` : '⚪ Unverified by guests';
  if (mbps >= 100) return `🟢 ${mbps} Mbps fiber${who}`;
  if (mbps >= 40) return `🟡 ${mbps} Mbps, fine for Slack and email`;
  return `🔴 ${mbps} Mbps, risky for video calls`;
}

function noiseLine(p: Property): string {
  const level = p.verifiedHighlights.nightNoiseLevel;
  const ev = evaluateNoise(SIGNALS.noise, p.reviews || []);
  if (level === 'loud late night' || (!level && ev.status === 'mixed')) return `🔴 Loud at night (${ev.headlineSummary.toLowerCase()})`;
  if (level === 'moderate') return '🟡 Moderate (some street or cafe noise in the evening)';
  if (level === 'dead quiet' || ev.status === 'verified') return '🟢 Quiet at night';
  return '⚪ Not mentioned in reviews';
}

function diveLine(p: Property): string {
  const m = p.distanceToDiveCenterMins;
  if (m <= 3) return `Doorstep: ${m} min to the dive boats`;
  if (m <= 10) return `${m} min to the dive center or pier`;
  return `${m} min each way to the dive boats`;
}

function deriveDrawerCopy(p: Property) {
  const mbps = p.verifiedHighlights.wifiSpeedMbps ?? 0;
  const quiet = p.verifiedHighlights.nightNoiseLevel === 'dead quiet';
  const loud = p.verifiedHighlights.nightNoiseLevel === 'loud late night';
  const dive = p.distanceToDiveCenterMins;
  const whatYouGain: string[] = [];
  const whatYouSacrifice: string[] = [];

  if (mbps >= 100) whatYouGain.push(`${mbps} Mbps Wi-Fi, enough for back-to-back video calls.`);
  else if (mbps > 0 && mbps < 40) whatYouSacrifice.push(`Only ~${mbps} Mbps Wi-Fi; video calls are a gamble.`);
  if (quiet) whatYouGain.push('Quiet nights for proper sleep.');
  if (loud) whatYouSacrifice.push('Late-night noise; light sleepers will struggle.');
  if (dive <= 5) whatYouGain.push(`${dive} min to the dive boats.`);
  else if (dive > 10) whatYouSacrifice.push(`${dive} min each way to the dive boats.`);
  if (hasAmenity(p, 'Dedicated Workspace')) whatYouGain.push('A listed dedicated workspace.');
  else whatYouSacrifice.push('No dedicated workspace listed.');
  if (hasAmenity(p, 'Pool')) whatYouGain.push('A pool on site.');

  const forWork = mbps >= 100 && !loud;
  const forDiving = dive <= 5;
  const bestSuitedFor = forWork && forDiving ? 'Remote workers who dive before or after their calls.'
    : forWork ? 'Remote workers who need reliable calls and quiet focus.'
    : forDiving ? 'Divers who want to be close to the boats.'
    : 'Travelers prioritising setting and price over work or dive logistics.';
  const notIdealFor = !forWork ? 'Anyone with a full day of video calls.'
    : dive > 10 ? 'Divers on daily boat trips.'
    : 'Travelers looking for nightlife on the doorstep.';

  return {
    vibeAtmosphere: p.vibeAtmosphere ?? p.tagline,
    travelerFeeling: p.travelerFeeling ?? (forWork ? 'Focused and settled.' : 'Relaxed and unhurried.'),
    whatYouGain, whatYouSacrifice, bestSuitedFor, notIdealFor,
  };
}

type Priority = 'wifi' | 'noise' | 'diving' | 'price';

const NOISE_RANK: Record<string, number> = { 'dead quiet': 0, 'moderate': 1, 'loud late night': 2 };

/** Picks the strongest property on one dimension; ties go to the cheaper stay. */
function bestFor(props: Property[], priority: Priority): Property {
  const key = (p: Property): number => {
    switch (priority) {
      case 'wifi': return -(p.verifiedHighlights.wifiSpeedMbps ?? 0);
      case 'noise': return NOISE_RANK[p.verifiedHighlights.nightNoiseLevel ?? ''] ?? 1;
      case 'diving': return p.distanceToDiveCenterMins;
      case 'price': return p.pricePerNightUsd;
    }
  };
  return [...props].sort((a, b) => key(a) - key(b) || a.pricePerNightUsd - b.pricePerNightUsd)[0];
}

const PRIORITY_PHRASE: Record<Priority, (p: Property) => string> = {
  wifi: p => `daily video calls are non-negotiable, choose ${p.title} (${p.verifiedHighlights.wifiSpeedMbps ?? '?'} Mbps)`,
  noise: p => `sleep comes first, choose ${p.title} (${p.verifiedHighlights.nightNoiseLevel ?? 'quietest of the set'})`,
  diving: p => `you're mainly here to dive, choose ${p.title} (${p.distanceToDiveCenterMins} min to the boats)`,
  price: p => `budget leads, choose ${p.title} at $${p.pricePerNightUsd}/night`,
};

/** Orders priorities by what the traveler asked for, then fills in the rest. */
function prioritiesFromQuery(userQuery: string): Priority[] {
  const asked: Priority[] = [];
  if (userQuery.trim()) {
    for (const s of decomposeQuery(userQuery).semanticSignals) {
      const c = classifySignal(s);
      if ((c === 'wifi' || c === 'workspace') && !asked.includes('wifi')) asked.push('wifi');
      if (c === 'noise' && !asked.includes('noise')) asked.push('noise');
      if (c === 'diving' && !asked.includes('diving')) asked.push('diving');
    }
    if (/\b(cheap|budget|under|affordable|value)\b/i.test(userQuery) && !asked.includes('price')) asked.push('price');
  }
  for (const p of ['wifi', 'noise', 'diving', 'price'] as Priority[]) if (!asked.includes(p)) asked.push(p);
  return asked;
}

export function synthesizeEditorialVerdictSync(pinnedProperties: Property[], userQuery: string): TradeOffVerdict {
  if (pinnedProperties.length === 0) {
    return {
      pinnedProperties: [],
      overallVerdict: "No stays pinned. Select 2 or 3 properties to compare their trade-offs.",
      comparisonMatrix: [],
      executiveRecommendation: "Pin at least two listings to see what each one gives up."
    };
  }

  const comparisonMatrix = pinnedProperties.map(prop => {
    const curated = CURATED_COPY[prop.id];
    const derived = deriveDrawerCopy(prop);
    return {
      propertyId: prop.id,
      title: prop.title,
      vibeAtmosphere: curated?.drawerVibe ?? derived.vibeAtmosphere,
      travelerFeeling: curated?.drawerFeeling ?? derived.travelerFeeling,
      whatYouGain: curated?.whatYouGain ?? derived.whatYouGain,
      whatYouSacrifice: curated?.whatYouSacrifice ?? derived.whatYouSacrifice,
      bestSuitedFor: curated?.bestSuitedFor ?? derived.bestSuitedFor,
      notIdealFor: curated?.notIdealFor ?? derived.notIdealFor,
      wifiRating: wifiLine(prop),
      noiseVerdict: noiseLine(prop),
      divingLogistics: diveLine(prop),
    };
  });

  if (pinnedProperties.length === 1) {
    const p = pinnedProperties[0];
    return {
      pinnedProperties,
      overallVerdict: `${p.title} ($${p.pricePerNightUsd}/night, rated ${p.rating} across ${p.reviewCount} reviews). Its strengths and compromises are listed below, each tied to a guest review.`,
      comparisonMatrix,
      executiveRecommendation: "Pin a second or third stay to see the trade-offs side by side."
    };
  }

  // Data-driven verdict: find who wins each dimension, led by what the traveler asked for.
  const priorities = prioritiesFromQuery(userQuery);
  const winners = priorities.map(pr => ({ priority: pr, property: bestFor(pinnedProperties, pr) }));

  // Group dimensions by the property that wins them.
  const byProperty = new Map<string, Priority[]>();
  for (const w of winners) byProperty.set(w.property.id, [...(byProperty.get(w.property.id) ?? []), w.priority]);

  const LABEL: Record<Priority, string> = { wifi: 'Wi-Fi', noise: 'quiet nights', diving: 'dive access', price: 'price' };
  const titleOf = (id: string) => pinnedProperties.find(p => p.id === id)!.title;
  const join = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

  const tensions = [...byProperty.entries()].map(([id, prs]) => `${titleOf(id)} leads on ${join(prs.map(p => LABEL[p]))}`);
  const overallVerdict = byProperty.size === 1
    ? `${titleOf([...byProperty.keys()][0])} wins on every dimension we compare (Wi-Fi, quiet, dive access and price), so the others only make sense for reasons outside these criteria.`
    : `No single stay wins everything: ${join(tensions)}. Which one is right depends on what you're least willing to give up.`;

  // Recommendation: one clause per distinct winner, in priority order.
  const seen = new Set<string>();
  const clauses: string[] = [];
  for (const w of winners) {
    if (seen.has(w.property.id)) continue;
    seen.add(w.property.id);
    clauses.push(`If ${PRIORITY_PHRASE[w.priority](w.property)}`);
  }
  const executiveRecommendation = clauses.length === 1
    ? `${clauses[0]}. It covers all of your stated priorities.`
    : `${clauses.join('. ')}.`;

  return { pinnedProperties, overallVerdict, comparisonMatrix, executiveRecommendation };
}

/** Kept for backwards compatibility; the sync synthesizer is the fallback everywhere now. */
export async function synthesizeTradeOffVerdict(pinnedProperties: Property[], userQuery: string): Promise<TradeOffVerdict> {
  return synthesizeEditorialVerdictSync(pinnedProperties, userQuery);
}
