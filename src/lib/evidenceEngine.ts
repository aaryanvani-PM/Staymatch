import { Property, Review, EvidenceCitation, PropertyEvidenceResult, DecomposedQuery, TradeOffVerdict } from '../types';

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

export function decomposeQuery(rawQuery: string): DecomposedQuery {
  const q = rawQuery.toLowerCase();
  
  // 1. Region detection
  let region: string | undefined = undefined;
  if (q.includes('krabi') || q.includes('ao nang') || q.includes('klong muang') || q.includes('railay')) {
    region = 'Krabi';
  } else if (q.includes('phuket') || q.includes('chalong') || q.includes('rawai') || q.includes('kata')) {
    region = 'Phuket';
  }

  // 2. Max Price detection
  let maxPrice: number | undefined = undefined;
  const underMatch = q.match(/under\s*\$?(\d+)/i) || q.match(/<\s*\$?(\d+)/i) || q.match(/\$(\d+)\s*max/i) || q.match(/max\s*\$?(\d+)/i);
  if (underMatch) {
    maxPrice = parseInt(underMatch[1], 10);
  }

  // 3. Amenities
  const requiredAmenities: string[] = [];
  if (q.includes('pool')) requiredAmenities.push('Pool');
  if (q.includes('workspace') || q.includes('desk') || q.includes('chair')) requiredAmenities.push('Dedicated Workspace');
  if (q.includes('parking')) requiredAmenities.push('Parking');
  if (q.includes('kitchen')) requiredAmenities.push('Kitchen');

  // 4. Semantic Qualitative Signals
  const semanticSignals: string[] = [];
  
  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('zoom') || q.includes('calls') || q.includes('internet') || q.includes('fiber') || q.includes('mbps')) {
    semanticSignals.push("Fast & Reliable Wi-Fi for Video Calls / Zoom");
  }
  
  if (q.includes('quiet') || q.includes('noise') || q.includes('sleep') || q.includes('silent') || q.includes('peaceful') || q.includes('bar')) {
    semanticSignals.push("Quiet Environment for Night Sleep & Focus");
  }

  if (q.includes('dive') || q.includes('scuba') || q.includes('pier') || q.includes('boat') || q.includes('rinse')) {
    semanticSignals.push("Scuba Dive Logistics (Pier / Shops / Gear Proximity)");
  }

  if (q.includes('beach') || q.includes('ocean') || q.includes('sand') || q.includes('surf')) {
    semanticSignals.push("Beachfront Walkability & Sea Access");
  }

  if (q.includes('chair') || q.includes('monitor') || q.includes('cowork') || q.includes('co-work') || q.includes('workstation')) {
    semanticSignals.push("Ergonomic Workstation Setup");
  }

  // Defaults if query was very generic
  if (semanticSignals.length === 0) {
    semanticSignals.push("Fast & Reliable Wi-Fi for Video Calls / Zoom");
    semanticSignals.push("Quiet Environment for Night Sleep & Focus");
    semanticSignals.push("Scuba Dive Logistics (Pier / Shops / Gear Proximity)");
  }

  // Detect overall semantic vibe & traveler feeling
  let detectedVibe = "Balanced Coastal Workcation & Discovery";
  if (q.includes('zoom') || q.includes('fast wi-fi') || q.includes('fiber')) {
    if (q.includes('quiet')) {
      detectedVibe = "Deep Focus Workcation & Uninterrupted Rest";
    } else if (q.includes('dive')) {
      detectedVibe = "High-Productivity Workcation & Scuba Sanctuary";
    }
  } else if (q.includes('dive') || q.includes('pier')) {
    detectedVibe = "Early Dawn Dive Expedition & Pier Proximity";
  } else if (q.includes('nature') || q.includes('limestone') || q.includes('railay')) {
    detectedVibe = "Car-Free Limestone Solitude & Natural Rejuvenation";
  } else if (q.includes('executive') || q.includes('monitor')) {
    detectedVibe = "Executive Bandwidth & Hillside Panoramic Focus";
  }

  let userIntentSummary = `Looking for ${region ? region : 'Southeast Asia'} properties`;
  if (maxPrice) userIntentSummary += ` capped at $${maxPrice}/night`;
  userIntentSummary += ` with verified review evidence for ${semanticSignals.length} qualitative requirements.`;

  return {
    rawQuery,
    hardFilters: {
      region,
      maxPrice,
      requiredAmenities
    },
    semanticSignals,
    userIntentSummary,
    detectedVibe
  };
}

// Evaluate review corpus for a specific property against semantic cues
export function evaluatePropertyAgainstReviewSignals(
  property: Property,
  signals: string[]
): EvidenceCitation[] {
  const citations: EvidenceCitation[] = [];
  const reviews = property.reviews || [];

  for (const signal of signals) {
    const sLower = signal.toLowerCase();

    // 1. Wi-Fi / Zoom / Work calls
    if (sLower.includes('wi-fi') || sLower.includes('wifi') || sLower.includes('zoom') || sLower.includes('internet')) {
      const negativeRev = reviews.find(r => 
        r.text.toLowerCase().includes('dropped') || 
        r.text.toLowerCase().includes('lags') || 
        r.text.toLowerCase().includes('struggled') ||
        (r.text.toLowerCase().includes('wi-fi') && r.text.toLowerCase().includes('not'))
      );

      const highFiberRev = reviews.find(r => 
        r.text.toLowerCase().includes('fiber') || 
        r.text.toLowerCase().includes('mbps') || 
        r.text.toLowerCase().includes('zoom marathon') ||
        r.text.toLowerCase().includes('product calls') ||
        r.text.toLowerCase().includes('packet loss')
      );

      if (negativeRev && !highFiberRev) {
        citations.push({
          signalQuery: signal,
          category: 'wifi',
          status: 'mixed',
          statusLabel: 'Mixed Feedback',
          headlineSummary: 'Wi-Fi dropped during calls or lags in weather',
          verbatimQuote: negativeRev.text,
          reviewId: negativeRev.id,
          author: negativeRev.author,
          reviewDate: negativeRev.date
        });
      } else if (negativeRev && highFiberRev) {
        citations.push({
          signalQuery: signal,
          category: 'wifi',
          status: 'mixed',
          statusLabel: 'Mixed Feedback',
          headlineSummary: 'Good speeds but potential peak-hour dropoffs reported',
          verbatimQuote: negativeRev.text,
          reviewId: negativeRev.id,
          author: negativeRev.author,
          reviewDate: negativeRev.date
        });
      } else if (highFiberRev) {
        citations.push({
          signalQuery: signal,
          category: 'wifi',
          status: 'verified',
          statusLabel: 'Verified by Guests',
          headlineSummary: `Consistently verified fiber connection (${property.verifiedHighlights.wifiSpeedMbps || 185} Mbps)`,
          verbatimQuote: highFiberRev.text,
          reviewId: highFiberRev.id,
          author: highFiberRev.author,
          reviewDate: highFiberRev.date
        });
      } else {
        const generalWifiRev = reviews.find(r => r.text.toLowerCase().includes('wi-fi') || r.text.toLowerCase().includes('wifi'));
        if (generalWifiRev) {
          citations.push({
            signalQuery: signal,
            category: 'wifi',
            status: 'verified',
            statusLabel: 'Verified by Guests',
            headlineSummary: 'Standard connection adequate for general browsing',
            verbatimQuote: generalWifiRev.text,
            reviewId: generalWifiRev.id,
            author: generalWifiRev.author,
            reviewDate: generalWifiRev.date
          });
        } else {
          citations.push({
            signalQuery: signal,
            category: 'wifi',
            status: 'unmentioned',
            statusLabel: 'Not Mentioned in Reviews',
            headlineSummary: 'No guest reviews have explicitly verified video call bandwidth',
          });
        }
      }
      continue;
    }

    // 2. Quiet environment / Noise / Sleep
    if (sLower.includes('quiet') || sLower.includes('noise') || sLower.includes('sleep')) {
      const noisyRev = reviews.find(r => 
        r.text.toLowerCase().includes('bar') || 
        r.text.toLowerCase().includes('blasts bass') || 
        r.text.toLowerCase().includes('music') || 
        r.text.toLowerCase().includes('do not book this if you need to') ||
        r.text.toLowerCase().includes('street chatter')
      );

      const quietRev = reviews.find(r => 
        r.text.toLowerCase().includes('dead quiet') || 
        r.text.toLowerCase().includes('super quiet') || 
        r.text.toLowerCase().includes('cul-de-sac') || 
        r.text.toLowerCase().includes('zero cars') ||
        r.text.toLowerCase().includes('double-glazed') ||
        r.text.toLowerCase().includes('total peace')
      );

      if (noisyRev) {
        citations.push({
          signalQuery: signal,
          category: 'noise',
          status: 'mixed',
          statusLabel: 'Mixed Feedback',
          headlineSummary: 'Bar music or street chatter noted past midnight',
          verbatimQuote: noisyRev.text,
          reviewId: noisyRev.id,
          author: noisyRev.author,
          reviewDate: noisyRev.date
        });
      } else if (quietRev) {
        citations.push({
          signalQuery: signal,
          category: 'noise',
          status: 'verified',
          statusLabel: 'Verified by Guests',
          headlineSummary: 'Dead quiet nocturnal environment verified by multiple guests',
          verbatimQuote: quietRev.text,
          reviewId: quietRev.id,
          author: quietRev.author,
          reviewDate: quietRev.date
        });
      } else {
        citations.push({
          signalQuery: signal,
          category: 'noise',
          status: 'unmentioned',
          statusLabel: 'Not Mentioned in Reviews',
          headlineSummary: 'Ambient night noise levels not cited in available reviews'
        });
      }
      continue;
    }

    // 3. Dive Logistics (Pier, Dive Center, Rinse station)
    if (sLower.includes('dive') || sLower.includes('scuba') || sLower.includes('pier')) {
      const diveRev = reviews.find(r => 
        r.text.toLowerCase().includes('dive') || 
        r.text.toLowerCase().includes('padi') || 
        r.text.toLowerCase().includes('chalong pier') ||
        r.text.toLowerCase().includes('longtail') ||
        r.text.toLowerCase().includes('rinse tank') ||
        r.text.toLowerCase().includes('boat departures')
      );

      const distantDiveRev = reviews.find(r =>
        r.text.toLowerCase().includes('20-minute taxi') ||
        r.text.toLowerCase().includes('commute across the kata hill')
      );

      if (distantDiveRev && property.distanceToDiveCenterMins > 10) {
        citations.push({
          signalQuery: signal,
          category: 'diving',
          status: 'mixed',
          statusLabel: 'Mixed Feedback',
          headlineSummary: `Distance penalty: ~${property.distanceToDiveCenterMins} mins commute each way to primary boat pier`,
          verbatimQuote: distantDiveRev.text,
          reviewId: distantDiveRev.id,
          author: distantDiveRev.author,
          reviewDate: distantDiveRev.date
        });
      } else if (diveRev) {
        citations.push({
          signalQuery: signal,
          category: 'diving',
          status: 'verified',
          statusLabel: 'Verified by Guests',
          headlineSummary: `Prime dive location (${property.distanceToDiveCenterMins} mins to departure pier or dive center)`,
          verbatimQuote: diveRev.text,
          reviewId: diveRev.id,
          author: diveRev.author,
          reviewDate: diveRev.date
        });
      } else {
        citations.push({
          signalQuery: signal,
          category: 'diving',
          status: 'unmentioned',
          statusLabel: 'Not Mentioned in Reviews',
          headlineSummary: 'Guest reviews do not mention scuba dive facilities or boat departures'
        });
      }
      continue;
    }

    // 4. Ergonomic workspace / desk / monitors
    if (sLower.includes('workstation') || sLower.includes('workspace') || sLower.includes('ergonomic') || sLower.includes('monitor')) {
      const workspaceRev = reviews.find(r => 
        r.text.toLowerCase().includes('chair') || 
        r.text.toLowerCase().includes('desk') || 
        r.text.toLowerCase().includes('monitor') || 
        r.text.toLowerCase().includes('study') ||
        r.text.toLowerCase().includes('co-working lounge')
      );

      const noDeskRev = reviews.find(r => 
        r.text.toLowerCase().includes('no proper desk') || 
        r.text.toLowerCase().includes('low coffee table')
      );

      if (noDeskRev) {
        citations.push({
          signalQuery: signal,
          category: 'workspace',
          status: 'mixed',
          statusLabel: 'Mixed Feedback',
          headlineSummary: 'Lacks ergonomic work desk (only coffee table / lounge furniture)',
          verbatimQuote: noDeskRev.text,
          reviewId: noDeskRev.id,
          author: noDeskRev.author,
          reviewDate: noDeskRev.date
        });
      } else if (workspaceRev) {
        citations.push({
          signalQuery: signal,
          category: 'workspace',
          status: 'verified',
          statusLabel: 'Verified by Guests',
          headlineSummary: 'Confirmed dedicated workspace with ergonomic seating or monitor access',
          verbatimQuote: workspaceRev.text,
          reviewId: workspaceRev.id,
          author: workspaceRev.author,
          reviewDate: workspaceRev.date
        });
      } else {
        citations.push({
          signalQuery: signal,
          category: 'workspace',
          status: 'unmentioned',
          statusLabel: 'Not Mentioned in Reviews',
          headlineSummary: 'No explicit guest testimony regarding dedicated laptop desk setup'
        });
      }
      continue;
    }

    // 5. Beachfront / Location
    const locationRev = reviews.find(r => 
      r.text.toLowerCase().includes('beach') || 
      r.text.toLowerCase().includes('sea') || 
      r.text.toLowerCase().includes('scooter') || 
      r.text.toLowerCase().includes('cul-de-sac') ||
      r.text.toLowerCase().includes('walk')
    );

    if (locationRev) {
      citations.push({
        signalQuery: signal,
        category: 'location',
        status: 'verified',
        statusLabel: 'Verified by Guests',
        headlineSummary: 'Atmosphere and accessibility validated in recent guest reviews',
        verbatimQuote: locationRev.text,
        reviewId: locationRev.id,
        author: locationRev.author,
        reviewDate: locationRev.date
      });
    } else {
      citations.push({
        signalQuery: signal,
        category: 'location',
        status: 'unmentioned',
        statusLabel: 'Not Mentioned in Reviews',
        headlineSummary: 'No direct guest mentions found for this criteria'
      });
    }
  }

  return citations;
}

export function filterAndScoreProperties(
  properties: Property[],
  decomposed: DecomposedQuery
): PropertyEvidenceResult[] {
  const { hardFilters, semanticSignals } = decomposed;

  return properties.map(property => {
    const hardFilterReasons: string[] = [];
    let hardFilterMatch = true;

    // Region check
    if (hardFilters.region) {
      const matchRegion = property.region.toLowerCase() === hardFilters.region.toLowerCase() ||
        property.location.toLowerCase().includes(hardFilters.region.toLowerCase());
      if (!matchRegion) {
        hardFilterMatch = false;
        hardFilterReasons.push(`Located in ${property.region}, not ${hardFilters.region}`);
      }
    }

    // Price check
    if (hardFilters.maxPrice && property.pricePerNightUsd > hardFilters.maxPrice) {
      hardFilterMatch = false;
      hardFilterReasons.push(`$${property.pricePerNightUsd}/night exceeds budget of $${hardFilters.maxPrice}`);
    }

    // Amenity checks
    if (hardFilters.requiredAmenities && hardFilters.requiredAmenities.length > 0) {
      for (const req of hardFilters.requiredAmenities) {
        const hasAmenity = property.listedAmenities.some(a => a.toLowerCase().includes(req.toLowerCase()));
        if (!hasAmenity) {
          hardFilterReasons.push(`Missing listed amenity: ${req}`);
        }
      }
    }

    // Evidence badges
    const evidenceBadges = evaluatePropertyAgainstReviewSignals(property, semanticSignals);

    // Qualitative score calculation
    let score = property.rating * 15; // base 70-75 pts
    for (const badge of evidenceBadges) {
      if (badge.status === 'verified') score += 10;
      else if (badge.status === 'mixed') score -= 5;
    }
    if (!hardFilterMatch) score -= 30;

    // Strengths
    const strengths: string[] = [];
    if (property.verifiedHighlights.wifiSpeedMbps && property.verifiedHighlights.wifiSpeedMbps > 100) {
      strengths.push(`${property.verifiedHighlights.wifiSpeedMbps} Mbps Fiber Wi-Fi`);
    }
    if (property.verifiedHighlights.nightNoiseLevel === 'dead quiet') {
      strengths.push("Dead quiet nocturnal cul-de-sac / double glazing");
    }
    if (property.distanceToDiveCenterMins <= 5) {
      strengths.push(`${property.distanceToDiveCenterMins} min access to dive boats`);
    }
    if (property.listedAmenities.includes('Dedicated Workspace')) {
      strengths.push("Ergonomic study workstation");
    }

    // Planted trade-off note
    let tradeOffNote = "";
    if (property.id === 'prop_krabi_01') {
      tradeOffNote = "Outstanding fiber bandwidth & silence, but requires scooter for Ao Nang restaurants.";
    } else if (property.id === 'prop_krabi_02') {
      tradeOffNote = "Unbeatable 2-min pier proximity and low price, but loud bar music and fragile Wi-Fi.";
    } else if (property.id === 'prop_krabi_03') {
      tradeOffNote = "Stunning limestone peacefulness, but lacks an ergonomic desk and Wi-Fi lags in storms.";
    } else if (property.id === 'prop_phuket_01') {
      tradeOffNote = "Exceptional co-working setup & 3-min pier walk, but boat harbor rather than soft sand beach.";
    } else if (property.id === 'prop_phuket_02') {
      tradeOffNote = "Blazing 300 Mbps fiber & infinity pool serenity, but steep hillside requires 150cc scooter.";
    } else if (property.id === 'prop_phuket_03') {
      tradeOffNote = "Direct surf beach access & cafe atmosphere, but 20-min daily commute to scuba boats.";
    }

    // Rich semantic vibe & sensory feeling
    let vibeAtmosphere = property.vibeAtmosphere || "Quiet tropical residential hideaway";
    let travelerFeeling = property.travelerFeeling || "Relaxed, authentic, and connected to nature.";

    if (property.id === 'prop_krabi_01') {
      vibeAtmosphere = "Sun-drenched teak seclusion & gentle jungle birdsong";
      travelerFeeling = "Calm, deeply productive, and completely in the flow during Zoom calls, with a private plunge pool reward at sunset.";
    } else if (property.id === 'prop_krabi_02') {
      vibeAtmosphere = "Electric pierfront salt breeze & late-night acoustic bass";
      travelerFeeling = "Thrilled by 3-minute boat access and lively dive energy, but drained if you need quiet sleep before 1 AM.";
    } else if (property.id === 'prop_krabi_03') {
      vibeAtmosphere = "Towering limestone amphitheater & tropical morning mist";
      travelerFeeling = "Completely grounded and disconnected from urban stress, though antsy if you need a high-speed video upload.";
    } else if (property.id === 'prop_phuket_01') {
      vibeAtmosphere = "Purpose-built maritime efficiency & focused diver community";
      travelerFeeling = "Unstoppable momentum: finishing 3 deep reef dives by afternoon and jumping straight into product calls with dual monitors.";
    } else if (property.id === 'prop_phuket_02') {
      vibeAtmosphere = "Panoramic Andaman Sea infinity views & breezy hill silence";
      travelerFeeling = "Inspiring executive retreat with total acoustic peace, provided you're comfortable riding a scooter up the steep hill.";
    } else if (property.id === 'prop_phuket_03') {
      vibeAtmosphere = "Golden-hour surf breaks & vibrant coastal cafe chatter";
      travelerFeeling = "Carefree and sun-kissed with surfboards at the door, but slightly weary if commuting across the island daily for scuba boats.";
    }

    return {
      property,
      hardFilterMatch,
      hardFilterReasons,
      evidenceBadges,
      score: Math.max(20, Math.min(99, Math.round(score))),
      strengths,
      tradeOffNote,
      vibeAtmosphere,
      travelerFeeling
    };
  }).sort((a, b) => {
    // Sort matching hard filters first, then score
    if (a.hardFilterMatch && !b.hardFilterMatch) return -1;
    if (!a.hardFilterMatch && b.hardFilterMatch) return 1;
    return b.score - a.score;
  });
}

// 3-Way Smart Trade-Off Synthesizer
// 3-Way Smart Trade-Off Synthesizer: Refactored to utilize Gemini API with an editorial-style travel expert persona
export async function synthesizeTradeOffVerdict(
  pinnedProperties: Property[],
  userQuery: string
): Promise<TradeOffVerdict> {
  if (pinnedProperties.length === 0) {
    return {
      pinnedProperties: [],
      overallVerdict: "No stays currently pinned. Select 2 or 3 properties to receive our Travel Editor's executive trade-off synthesis.",
      comparisonMatrix: [],
      executiveRecommendation: "Pin at least two listings to contrast qualitative nuances, emotional feelings, and local trade-offs."
    };
  }

  // 1. First, attempt to invoke the server-side Gemini API endpoint for live model synthesis
  if (typeof fetch === 'function') {
    try {
      const response = await fetch('/api/tradeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: pinnedProperties,
          query: userQuery,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.comparisonMatrix && data.comparisonMatrix.length > 0) {
          return data as TradeOffVerdict;
        }
      }
    } catch {
      // Gracefully fall through to the editorial expert synthesizer
    }
  }

  // 2. High-fidelity travel editor persona fallback with emotional context and descriptive local insights
  return synthesizeEditorialVerdictSync(pinnedProperties, userQuery);
}

// Synchronous high-fidelity editorial synthesizer adopting a knowledgeable travel expert persona
export function synthesizeEditorialVerdictSync(
  pinnedProperties: Property[],
  userQuery: string
): TradeOffVerdict {
  if (pinnedProperties.length === 0) {
    return {
      pinnedProperties: [],
      overallVerdict: "No stays pinned. Select 2 or 3 properties to receive our Travel Editor's executive synthesis.",
      comparisonMatrix: [],
      executiveRecommendation: "Pin at least two listings to contrast qualitative nuances and local trade-offs."
    };
  }

  const comparisonMatrix = pinnedProperties.map(prop => {
    const whatYouGain: string[] = [];
    const whatYouSacrifice: string[] = [];
    let bestSuitedFor = "";
    let notIdealFor = "";
    let wifiRating = "";
    let noiseVerdict = "";
    let divingLogistics = "";
    let vibeAtmosphere = prop.vibeAtmosphere || "Curated coastal residence";
    let travelerFeeling = prop.travelerFeeling || "Relaxed, genuine, and unhurried.";

    if (prop.id === 'prop_krabi_01') {
      vibeAtmosphere = "Sun-drenched teak seclusion & jungle canopy birdsong in Klong Muang";
      travelerFeeling = "Calm, deeply productive, and completely in the flow during high-stakes video calls, with private plunge pool solace at sunset.";
      whatYouGain.push("185 Mbps verified symmetric fiber—unflinching bandwidth that guarantees zero frozen frames during 4-hour Zoom marathons.");
      whatYouGain.push("Acoustic sanctuary: tucked inside a residential cul-de-sac far from the highway, waking only to morning tropical birds.");
      whatYouGain.push("Private plunge pool surrounded by frangipani trees and an ergonomic study chair that saves your lumbar spine.");
      whatYouSacrifice.push("15-minute scooter drive through rural roads to reach Ao Nang's seafood night markets and vibrant cafe strip.");
      whatYouSacrifice.push("Dinner variety requires renting a scooter or waiting for Grab drivers on quiet Klong Muang lanes.");
      bestSuitedFor = "Digital nomads and international executives whose client meetings and restorative deep sleep are non-negotiable.";
      notIdealFor = "Solo backpackers seeking spontaneous beachfront bar crawls outside their front door.";
      wifiRating = "⭐⭐⭐⭐⭐ 185 Mbps Fiber (Verified by Liam K. — zero packet drops)";
      noiseVerdict = "🟢 Dead Quiet (Secluded cul-de-sac away from beach traffic)";
      divingLogistics = "6 min scooter ride to Aqua Vision Dive Center";
    } else if (prop.id === 'prop_krabi_02') {
      vibeAtmosphere = "High-octane pierfront salt spray & late-night acoustic bass";
      travelerFeeling = "Electrified by 3-minute boat departures and lively dive hub energy, but psychologically drained if you need quiet sleep before 1:00 AM.";
      whatYouGain.push("Unbeatable doorstep logistics: 3 PADI 5-star dive shops are downstairs, with longtail boat pickups just 3 minutes away.");
      whatYouGain.push("Exceptional budget efficiency at $72/night with a dedicated outdoor rinse tank for wetsuits and BCD gear.");
      whatYouGain.push("Panoramic balcony vistas of longtail wooden bows bobbing against Ao Nang's limestone headlands.");
      whatYouSacrifice.push("Punishing night noise: the live music bar across the alley blasts bass through single-pane glass until 1:00 AM.");
      whatYouSacrifice.push("Vulnerable shared hotel Wi-Fi that dropped twice during team standups, making video calls high-risk.");
      bestSuitedFor = "Passionate scuba divers on dawn boat itineraries who fall asleep easily and don't need to work on vacation.";
      notIdealFor = "Remote engineers, light sleepers, or professionals managing international teams.";
      wifiRating = "🔴 Vulnerable (Dropped twice during team standup — David S.)";
      noiseVerdict = "🔴 Loud (Live music bar across alley blasts bass until 1:00 AM)";
      divingLogistics = "Doorstep access (2 min walk to 3 PADI centers & longtails)";
    } else if (prop.id === 'prop_krabi_03') {
      vibeAtmosphere = "Dramatic prehistoric karst amphitheater & car-free tropical mist";
      travelerFeeling = "Completely unhurried and grounded in raw natural wonder; deeply contemplative rather than corporate.";
      whatYouGain.push("Total car-free tranquility: zero motorbikes or cars on Railay East, allowing emerald lagoon breezes and birdcalls.");
      whatYouGain.push("Direct 8-minute boardwalk walk beneath towering karst cliffs to Railay Dive Center.");
      whatYouGain.push("Eco-luxury aesthetic with teak woodwork, lush garden verandas, and postcard limestone views.");
      whatYouSacrifice.push("Ergonomic limitation: only a low lounge coffee table with no proper desk or task chair for laptop work.");
      whatYouSacrifice.push("Peninsula microwave internet link that throttles and lags during sudden tropical monsoon squalls.");
      bestSuitedFor = "Writers, couples, and creative professionals seeking an unplugged nature escape with light email checking.";
      notIdealFor = "Hardware or software engineers requiring multi-monitor setups or consistent upload bandwidth.";
      wifiRating = "🟡 25 Mbps (Fine for Netflix/Slack, lags in heavy rainstorms — Chloe G.)";
      noiseVerdict = "🟢 Dead Quiet (Zero cars or motorbikes on Railay peninsula)";
      divingLogistics = "8 min boardwalk stroll to Railay Dive Center";
    } else if (prop.id === 'prop_phuket_01') {
      vibeAtmosphere = "Maritime efficiency & tech-forward focus at Chalong Marina";
      travelerFeeling = "Accomplished, high-performing, and seamlessly balanced: dawn deep reef diving followed by evening sprint calls.";
      whatYouGain.push("Instant 3-minute stroll to Chalong Pier where all day boats depart for Phi Phi and Racha islands at 7:30 AM.");
      whatYouGain.push("Dedicated 24/7 second-floor co-working lounge equipped with external plug-in monitors and 200 Mbps fiber.");
      whatYouGain.push("Double-glazed acoustic windows ensuring whisper-quiet sleep even during morning boat harbor prep.");
      whatYouSacrifice.push("Industrial boat bay: Chalong is a working marina with moored yachts, not a soft white swimming beach.");
      whatYouSacrifice.push("Reaching Kata or Nai Harn surf beaches requires a 12-minute taxi over the ridge ($10-15 each way).");
      bestSuitedFor = "Working divers and product leads who demand uncompromising fiber speeds after a 3-dive day.";
      notIdealFor = "Travelers whose primary fantasy is stepping straight out of bed onto powder-white sunbathing sands.";
      wifiRating = "⭐⭐⭐⭐⭐ 200 Mbps Fiber + 24/7 Co-working monitors";
      noiseVerdict = "🟢 Dead Quiet (Double-glazed acoustic glass in bedrooms)";
      divingLogistics = "3 min walk to Chalong Pier departure docks";
    } else if (prop.id === 'prop_phuket_02') {
      vibeAtmosphere = "Panoramic Andaman Sea elevation & quiet tropical luxury";
      travelerFeeling = "Elevated, private, and creatively inspired overlooking Rawai bay, with the serenity of a private hilltop villa.";
      whatYouGain.push("Unrivaled 300 Mbps symmetric fiber bandwidth tested with zero packet loss across executive team reviews.");
      whatYouGain.push("Private infinity pool overlooking the turquoise Andaman Sea with breathtaking golden-hour sunsets.");
      whatYouGain.push("Total acoustic seclusion nestled amidst tropical rubber trees and coastal breeze.");
      whatYouSacrifice.push("Steep 25-degree hillside access that demands a powerful 150cc scooter or rented SUV.");
      whatYouSacrifice.push("11-minute drive down the winding ridge to reach Chalong dive boat departure docks.");
      bestSuitedFor = "Tech leads, founders, and couples seeking high-end workcation luxury and total visual privacy.";
      notIdealFor = "Nervous drivers or pedestrians who dislike steep hills.";
      wifiRating = "⭐⭐⭐⭐⭐ 300 Mbps Symmetric (Tested by Karin M.)";
      noiseVerdict = "🟢 Dead Quiet (Hillside jungle canopy)";
      divingLogistics = "11 min drive down to Chalong Pier";
    } else {
      vibeAtmosphere = "Golden-hour surf breaks, iced espresso chatter & beachside ease";
      travelerFeeling = "Carefree and sun-kissed with surfboards at the door, but slightly weary if commuting across the island daily.";
      whatYouGain.push("Immediate barefoot access to Kata's golden sands and surfable waves.");
      whatYouGain.push("Lively on-site cafe with artisanal coffee and relaxed social vibes.");
      whatYouSacrifice.push("20-minute daily taxi crossing over the Kata hill to Chalong dive boats, adding $30-40 daily in Grab fares.");
      whatYouSacrifice.push("Shared cafe Wi-Fi that fluctuates during lunch rush hours when guests crowd the router.");
      bestSuitedFor = "Surfers, digital creatives, and social travelers who prioritize wave access over morning dive boat logistics.";
      notIdealFor = "Serious divers on multi-day boat itineraries needing punctual dawn transfers.";
      wifiRating = "🟡 45 Mbps (Adequate for Slack, fluctuates during cafe rush)";
      noiseVerdict = "🟡 Moderate (Street and cafe chatter until 11:00 PM)";
      divingLogistics = "20 min taxi across Kata hill to Chalong Pier";
    }

    return {
      propertyId: prop.id,
      title: prop.title,
      vibeAtmosphere,
      travelerFeeling,
      whatYouGain,
      whatYouSacrifice,
      bestSuitedFor,
      notIdealFor,
      wifiRating,
      noiseVerdict,
      divingLogistics
    };
  });

  // Synthesize overarching verdict with travel expert persona
  let overallVerdict = "";
  let executiveRecommendation = "";

  if (pinnedProperties.length === 1) {
    const p = pinnedProperties[0];
    overallVerdict = `Travel Editor's Assessment: ${p.title} presents an authentic profile rooted in ${p.reviewCount} verified guest experiences. The key here is acknowledging its intentional design—whether that leans toward deep digital productivity or doorstep island adventure.`;
    executiveRecommendation = `Pin a 2nd or 3rd stay to contrast trade-offs side by side through our local editorial lens.`;
  } else if (pinnedProperties.length === 2) {
    const [a, b] = pinnedProperties;
    overallVerdict = `Travel Editor's Nuanced Verdict: Contrasting ${a.title} ($${a.pricePerNightUsd}/nt) against ${b.title} ($${b.pricePerNightUsd}/nt) lays bare the classic Andaman conundrum: guaranteed acoustic serenity and unflinching fiber bandwidth versus raw, doorstep pier accessibility and beachfront nightlife. One is built for deep cognitive focus and restorative rest; the other is designed for dawn boat departures and high-energy social exploration.`;
    executiveRecommendation = `Our Editorial Recommendation: If your trip depends on high-stakes video calls or restorative sleep, choose ${a.title}—the 15-minute Grab commute for dinner is a small price to pay for unbroken peace of mind. Conversely, if you are in Thailand primarily for dawn scuba boats and prioritize saving commute minutes over quiet sleep, ${b.title} delivers unbeatable logistics at an accessible rate.`;
  } else {
    const [a, b, c] = pinnedProperties;
    overallVerdict = `Travel Editor's Triangulation: Comparing ${a.title}, ${b.title}, and ${c.title} illustrates three distinct Andaman lifestyles. We have the executive workcation haven (teak seclusion and enterprise-grade fiber for deep focus), the high-velocity pierfront basecamp (immediate longtail access at the expense of nightlife noise), and the bohemian retreat (postcard natural wonder with casual island ergonomics).`;
    executiveRecommendation = `Our Editorial Recommendation: For travelers with mandatory daily Zoom meetings, ${pinnedProperties.find(p => p.verifiedHighlights.wifiSpeedMbps && p.verifiedHighlights.wifiSpeedMbps > 100)?.title || a.title} is the only property with verified high-bitrate video stability. If your itinerary is 80% scuba and you wake up at dawn, book the pierfront option; for romantic, slow-paced rejuvenation, choose the car-free cliff sanctuary.`;
  }

  return {
    pinnedProperties,
    overallVerdict,
    comparisonMatrix,
    executiveRecommendation
  };
}
