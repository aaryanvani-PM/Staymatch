import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  decomposeQuery,
  parseMaxPrice,
  mentions,
  mentionsAffirmed,
  extractMbps,
  classifySignal,
  evaluatePropertyAgainstReviewSignals,
  filterAndScoreProperties,
  synthesizeEditorialVerdictSync,
  SIGNALS,
  PRESET_QUERIES,
} from '../src/lib/evidenceEngine.ts';
import type { Property } from '../src/types.ts';

const catalog: Property[] = JSON.parse(readFileSync(new URL('../src/data/properties.json', import.meta.url), 'utf8'));
const byId = (id: string) => catalog.find(p => p.id === id)!;

const statusFor = (p: Property, signal: string) => evaluatePropertyAgainstReviewSignals(p, [signal])[0].status;

// --- text matching -----------------------------------------------------------

test('matching respects word boundaries', () => {
  assert.equal(mentions('the bar across the alley', 'bar'), true);
  assert.equal(mentions('it was barely audible', 'bar'), false);
  assert.equal(mentions('rainy season pricing', 'sea'), false);
});

test('negated mentions are ignored', () => {
  assert.equal(mentionsAffirmed('Wi-Fi never cut out on Zoom', 'cut out'), false);
  assert.equal(mentionsAffirmed('zero packet loss or lag', 'lag'), false);
  assert.equal(mentionsAffirmed('the connection lags in storms', 'lags'), true);
});

test('extracts the fastest quoted speed', () => {
  assert.equal(extractMbps('185 Mbps down / 90 Mbps up'), 185);
  assert.equal(extractMbps('no numbers here'), undefined);
});

// --- query decomposition -----------------------------------------------------

test('budget parsing handles common phrasings', () => {
  assert.equal(parseMaxPrice('under $130'), 130);
  assert.equal(parseMaxPrice('below 1,200 dollars'), 1200);
  assert.equal(parseMaxPrice('max $90'), 90);
  assert.equal(parseMaxPrice('$80-120 a night'), 120);
  assert.equal(parseMaxPrice('between $80 and $150'), 150);
  assert.equal(parseMaxPrice('around $300 per night'), 300);
  assert.equal(parseMaxPrice('200+ Mbps fiber in Phuket'), undefined);
});

test('decomposes the default query', () => {
  const d = decomposeQuery(PRESET_QUERIES[0].query);
  assert.equal(d.hardFilters.region, 'Krabi');
  assert.equal(d.hardFilters.maxPrice, 130);
  assert.deepEqual(d.semanticSignals, [SIGNALS.wifi, SIGNALS.noise, SIGNALS.diving]);
});

test('negated amenities are not required', () => {
  assert.deepEqual(decomposeQuery('beach stay with a pool').hardFilters.requiredAmenities, ['Pool']);
  assert.deepEqual(decomposeQuery('beach stay, no pool needed').hardFilters.requiredAmenities, []);
});

test('"bar" in a query no longer triggers the quiet signal', () => {
  const d = decomposeQuery('near a beach bar in Phuket');
  assert.ok(!d.semanticSignals.includes(SIGNALS.noise));
});

test('model-phrased signals map onto engine categories', () => {
  assert.equal(classifySignal('Reliable internet for video meetings'), 'wifi');
  assert.equal(classifySignal('Quiet at night for sleep'), 'noise');
  assert.equal(classifySignal('Walking distance to dive boats'), 'diving');
  assert.equal(classifySignal('Proper desk and chair'), 'workspace');
});

// --- evidence grounding ------------------------------------------------------

test('Wi-Fi evidence matches the reviews', () => {
  assert.equal(statusFor(byId('prop_krabi_01'), SIGNALS.wifi), 'verified');
  assert.equal(statusFor(byId('prop_phuket_02'), SIGNALS.wifi), 'verified', '"zero packet loss or lag" is praise');
  assert.equal(statusFor(byId('prop_krabi_02'), SIGNALS.wifi), 'mixed');
  assert.equal(statusFor(byId('prop_krabi_03'), SIGNALS.wifi), 'mixed');
  assert.equal(statusFor(byId('prop_phuket_03'), SIGNALS.wifi), 'mixed');
});

test('noise, dive and desk evidence matches the reviews', () => {
  assert.equal(statusFor(byId('prop_krabi_02'), SIGNALS.noise), 'mixed');
  assert.equal(statusFor(byId('prop_phuket_01'), SIGNALS.noise), 'verified');
  assert.equal(statusFor(byId('prop_phuket_03'), SIGNALS.diving), 'mixed');
  assert.equal(statusFor(byId('prop_phuket_02'), SIGNALS.diving), 'mixed');
  assert.equal(statusFor(byId('prop_krabi_02'), SIGNALS.diving), 'verified');
  assert.equal(statusFor(byId('prop_krabi_03'), SIGNALS.workspace), 'mixed');
});

test('a sandbox review saying Wi-Fi "never cut out" counts as positive', () => {
  const custom: Property = {
    ...byId('prop_krabi_01'),
    id: 'prop_custom_1',
    verifiedHighlights: {},
    reviews: [{ id: 'r1', author: 'Jordan T.', date: '2026-09', text: 'Fiber Wi-Fi reached 160 Mbps and never cut out on Zoom.' }],
  };
  assert.equal(statusFor(custom, SIGNALS.wifi), 'verified');
});

// --- scoring -----------------------------------------------------------------

test('missing a required amenity fails the hard filter', () => {
  const results = filterAndScoreProperties(catalog, decomposeQuery('Dedicated workspace in Phuket'));
  const surf = results.find(r => r.property.id === 'prop_phuket_03')!;
  assert.equal(surf.hardFilterMatch, false);
  assert.ok(surf.hardFilterReasons.some(r => r.includes('Dedicated Workspace')));
});

test('hard-filter matches rank above non-matches', () => {
  const results = filterAndScoreProperties(catalog, decomposeQuery(PRESET_QUERIES[0].query));
  const firstMiss = results.findIndex(r => !r.hardFilterMatch);
  assert.ok(firstMiss > 0);
  assert.ok(results.slice(firstMiss).every(r => !r.hardFilterMatch));
  assert.equal(results[0].property.id, 'prop_krabi_01');
});

// --- trade-off verdict -------------------------------------------------------

test('verdict picks the right winner per dimension', () => {
  const v = synthesizeEditorialVerdictSync([byId('prop_phuket_01'), byId('prop_phuket_03')], 'near dive boats with fast wifi');
  // Phuket_01 is both faster and closer to the pier, so it must not be recommended for one and the surf stay for the other.
  assert.ok(v.executiveRecommendation.includes(byId('prop_phuket_01').title));
  assert.ok(!/dive, choose .*Kata/i.test(v.executiveRecommendation));
});

test('verdict leads with what the traveler asked for', () => {
  const pins = [byId('prop_krabi_01'), byId('prop_krabi_02')];
  const dive = synthesizeEditorialVerdictSync(pins, 'I mostly want to dive');
  assert.ok(dive.executiveRecommendation.startsWith(`If you're mainly here to dive, choose ${byId('prop_krabi_02').title}`));
  const work = synthesizeEditorialVerdictSync(pins, 'fast wifi for zoom');
  assert.ok(work.executiveRecommendation.startsWith(`If daily video calls are non-negotiable, choose ${byId('prop_krabi_01').title}`));
});

test('sandbox properties get data-driven copy, not another listing\'s', () => {
  const custom: Property = {
    id: 'prop_custom_9', title: 'Test Villa', location: 'Ao Nang, Krabi', region: 'Krabi',
    pricePerNightUsd: 90, rating: 4.8, reviewCount: 10, distanceToDiveCenterMins: 4,
    listedAmenities: ['High-Speed Wi-Fi', 'Dedicated Workspace'], heroImage: '', tagline: 'Test tagline',
    verifiedHighlights: { wifiSpeedMbps: 160, nightNoiseLevel: 'dead quiet' }, reviews: [],
  };
  const v = synthesizeEditorialVerdictSync([custom, byId('prop_krabi_02')], '');
  const row = v.comparisonMatrix.find(r => r.propertyId === 'prop_custom_9')!;
  const all = JSON.stringify(row);
  assert.ok(!/Kata|surf/i.test(all), 'custom stay must not inherit the Kata surf copy');
  assert.match(row.wifiRating, /160 Mbps/);
  assert.match(row.divingLogistics, /4 min/);
});
