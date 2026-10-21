import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { decomposeQuery, synthesizeTradeOffVerdict } from './src/lib/evidenceEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let isGeminiQuotaDepleted = false;
let lastQuotaCheckTime = 0;
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000; // Check again after 5 minutes

// /api/decompose endpoint: Decomposes natural language into hard filters & semantic review signals
app.post('/api/decompose', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const now = Date.now();
    const geminiClient = ai;
    const canAttemptGemini = Boolean(geminiClient && (!isGeminiQuotaDepleted || (now - lastQuotaCheckTime > QUOTA_COOLDOWN_MS)));

    if (geminiClient && canAttemptGemini) {
      try {
        const prompt = `You are an elite travel concierge that extracts semantic context, emotional tone, and specific vibe cues from natural language travel queries. Decompose this query into hard filters (region, max price in USD, amenities), qualitative review signals, and the traveler's desired sensory vibe and feeling.
User query: "${query}"`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                region: { type: Type.STRING, description: "Identified region like Krabi or Phuket if specified, or null" },
                maxPrice: { type: Type.NUMBER, description: "Maximum price per night in USD if specified, or null" },
                requiredAmenities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of explicit required amenities like Pool, Workspace, Parking"
                },
                semanticSignals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of qualitative cues to ground in reviews (e.g., Fast & Reliable Wi-Fi for Zoom, Quiet at night for sleep)"
                },
                userIntentSummary: {
                  type: Type.STRING,
                  description: "Executive 1-sentence summary of traveler intent"
                },
                detectedVibe: {
                  type: Type.STRING,
                  description: "Sensory vibe and emotional tone of the trip (e.g., Deep Focus Workcation & Dawn Dive Sanctuary)"
                }
              },
              required: ["semanticSignals", "userIntentSummary", "detectedVibe"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          isGeminiQuotaDepleted = false;
          return res.json({
            rawQuery: query,
            hardFilters: {
              region: parsed.region || undefined,
              maxPrice: parsed.maxPrice || undefined,
              requiredAmenities: parsed.requiredAmenities || []
            },
            semanticSignals: parsed.semanticSignals && parsed.semanticSignals.length > 0
              ? parsed.semanticSignals
              : ["Fast & Reliable Wi-Fi for Video Calls / Zoom", "Quiet Environment for Night Sleep", "Scuba Dive Logistics"],
            userIntentSummary: parsed.userIntentSummary || "Evaluating properties against hard filters and qualitative signals.",
            detectedVibe: parsed.detectedVibe || "Deep Focus Workcation & Coastal Discovery",
            source: 'Gemini 3.8 Flash'
          });
        }
      } catch (err: any) {
        // Flag depleted quota to avoid repeated failed calls and error noise
        isGeminiQuotaDepleted = true;
        lastQuotaCheckTime = Date.now();
      }
    }

    // High-fidelity heuristic engine
    const result = decomposeQuery(query);
    return res.json({ ...result, source: 'StayMatch Semantic Engine' });
  } catch (outerErr: any) {
    const fallback = decomposeQuery(req.body?.query || '');
    return res.json({ ...fallback, source: 'StayMatch Semantic Engine' });
  }
});

// /api/tradeoff endpoint: Synthesizes executive 3-way trade-off verdicts
app.post('/api/tradeoff', async (req, res) => {
  try {
    const { properties, query } = req.body;
    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ error: 'At least 1 property is required' });
    }

    const now = Date.now();
    const geminiClient = ai;
    const canAttemptGemini = Boolean(geminiClient && (!isGeminiQuotaDepleted || (now - lastQuotaCheckTime > QUOTA_COOLDOWN_MS)) && properties.length >= 2);

    if (geminiClient && canAttemptGemini) {
      try {
        const summaryContext = properties.map((p: any) => `
Property ID: ${p.id}
Title: ${p.title}
Location: ${p.location}
Price: $${p.pricePerNightUsd}/night
Rating: ${p.rating} (${p.reviewCount} reviews)
Distance to Dive Center: ${p.distanceToDiveCenterMins} mins
Key Guest Reviews:
${(p.reviews || []).map((r: any) => `- [${r.id}] ${r.author} (${r.date}): "${r.text}"`).join('\n')}
`).join('\n---\n');

        const prompt = `You are StayMatch's Principal Travel Editor and local Andaman Archipelago insider (combining the discerning taste of a luxury travel correspondent with authentic on-the-ground local knowledge). A traveler is comparing stays for: "${query || 'Compare these properties'}".

Your mission: Instead of just listing dry pros and cons, craft an evocative, nuanced, editorial-style summary that highlights the genuine human trade-offs with emotional context and descriptive local insights.

Adopt this knowledgeable travel expert persona across all fields:
1. Sensory Vibe & Atmosphere: Evoke the acoustic landscape (e.g. canopy birdsong and breeze vs. late-night bass bouncing through alleys), morning light, and natural textures.
2. Traveler Feeling: Articulate what waking up and living there feels like emotionally and mentally (e.g. peaceful creative flow vs. energized social momentum vs. commuter fatigue).
3. What You Gain: Describe the specific real-world joys and advantages with descriptive local color.
4. What You Sacrifice: Candidly highlight the friction and compromises with authentic local context.
5. Best Suited For vs. Not Ideal For: Offer sharp, expert guidance on which traveler archetype belongs here.
6. Executive Overall Verdict: A nuanced, publication-grade editorial verdict synthesizing the core tension and dilemmas.
7. Executive Recommendation: Clear, decisive bottom-line guidance.

Context:
${summaryContext}`;

        const response = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallVerdict: { type: Type.STRING, description: "High-level synthesis of the trade-off dilemma" },
                executiveRecommendation: { type: Type.STRING, description: "Actionable decision rule (e.g. Choose A if X, choose B if Y)" },
                comparisonMatrix: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      propertyId: { type: Type.STRING },
                      title: { type: Type.STRING },
                      vibeAtmosphere: { type: Type.STRING, description: "Sensory vibe and acoustic atmosphere (e.g. Sun-drenched teak seclusion & jungle birdsong)" },
                      travelerFeeling: { type: Type.STRING, description: "Deep subjective feeling of what staying there actually feels like for the traveler" },
                      whatYouGain: { type: Type.ARRAY, items: { type: Type.STRING } },
                      whatYouSacrifice: { type: Type.ARRAY, items: { type: Type.STRING } },
                      bestSuitedFor: { type: Type.STRING },
                      notIdealFor: { type: Type.STRING },
                      wifiRating: { type: Type.STRING },
                      noiseVerdict: { type: Type.STRING },
                      divingLogistics: { type: Type.STRING }
                    },
                    required: ["propertyId", "title", "vibeAtmosphere", "travelerFeeling", "whatYouGain", "whatYouSacrifice", "bestSuitedFor", "notIdealFor", "wifiRating", "noiseVerdict", "divingLogistics"]
                  }
                }
              },
              required: ["overallVerdict", "executiveRecommendation", "comparisonMatrix"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          isGeminiQuotaDepleted = false;
          return res.json({
            pinnedProperties: properties,
            ...parsed,
            source: 'Gemini 3.8 Flash'
          });
        }
      } catch (err: any) {
        isGeminiQuotaDepleted = true;
        lastQuotaCheckTime = Date.now();
      }
    }

    // High-fidelity heuristic engine with knowledgeable travel expert persona
    const result = await synthesizeTradeOffVerdict(properties, query || '');
    return res.json({ ...result, source: 'StayMatch Semantic Engine' });
  } catch (outerErr: any) {
    const fallback = await synthesizeTradeOffVerdict(req.body?.properties || [], req.body?.query || '');
    return res.json({ ...fallback, source: 'StayMatch Semantic Engine' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StayMatch full-stack engine running on port ${PORT}`);
  });
}

startServer();
