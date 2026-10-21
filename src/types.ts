export interface Review {
  id: string;
  author: string;
  date: string;
  text: string;
  sentiment?: 'positive' | 'negative' | 'mixed';
  topics?: string[];
}

export interface Property {
  id: string;
  title: string;
  location: string;
  region: 'Krabi' | 'Phuket' | string;
  pricePerNightUsd: number;
  rating: number;
  reviewCount: number;
  distanceToDiveCenterMins: number;
  listedAmenities: string[];
  heroImage: string;
  tagline: string;
  vibeAtmosphere?: string;
  travelerFeeling?: string;
  reviews: Review[];
  verifiedHighlights: {
    wifiSpeedMbps?: number;
    deskAvailable?: boolean;
    nightNoiseLevel?: 'dead quiet' | 'moderate' | 'loud late night';
    divePierWalkMins?: number;
  };
}

export type EvidenceStatus = 'verified' | 'mixed' | 'unmentioned';

export interface EvidenceCitation {
  signalQuery: string;
  category: 'wifi' | 'noise' | 'diving' | 'workspace' | 'location' | 'general';
  status: EvidenceStatus;
  statusLabel: string;
  headlineSummary: string;
  verbatimQuote?: string;
  reviewId?: string;
  author?: string;
  reviewDate?: string;
}

export interface PropertyEvidenceResult {
  property: Property;
  hardFilterMatch: boolean;
  hardFilterReasons: string[];
  evidenceBadges: EvidenceCitation[];
  score: number;
  strengths: string[];
  tradeOffNote: string;
  vibeAtmosphere: string;
  travelerFeeling: string;
}

export interface DecomposedQuery {
  rawQuery: string;
  hardFilters: {
    region?: string;
    maxPrice?: number;
    minRating?: number;
    requiredAmenities?: string[];
  };
  semanticSignals: string[];
  userIntentSummary: string;
  detectedVibe?: string;
}

export interface TradeOffVerdict {
  pinnedProperties: Property[];
  overallVerdict: string;
  comparisonMatrix: {
    propertyId: string;
    title: string;
    vibeAtmosphere?: string;
    travelerFeeling?: string;
    whatYouGain: string[];
    whatYouSacrifice: string[];
    bestSuitedFor: string;
    notIdealFor: string;
    wifiRating: string;
    noiseVerdict: string;
    divingLogistics: string;
  }[];
  executiveRecommendation: string;
}
