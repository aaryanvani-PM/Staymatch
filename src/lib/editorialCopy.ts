// Hand-written editorial copy for the six sample properties.
// Anything not listed here (e.g. sandbox properties) gets copy derived from
// its data in evidenceEngine.ts, so the engine never mislabels a new stay.

export interface CuratedCopy {
  tradeOffNote: string;
  cardVibe: string;
  cardFeeling: string;
  drawerVibe: string;
  drawerFeeling: string;
  whatYouGain: string[];
  whatYouSacrifice: string[];
  bestSuitedFor: string;
  notIdealFor: string;
}

export const CURATED_COPY: Record<string, CuratedCopy> = {
  prop_krabi_01: {
    tradeOffNote: "Outstanding fiber bandwidth & silence, but requires scooter for Ao Nang restaurants.",
    cardVibe: "Sun-drenched teak seclusion & gentle jungle birdsong",
    cardFeeling: "Calm, deeply productive, and completely in the flow during Zoom calls, with a private plunge pool reward at sunset.",
    drawerVibe: "Sun-drenched teak seclusion & jungle canopy birdsong in Klong Muang",
    drawerFeeling: "Calm, deeply productive, and completely in the flow during high-stakes video calls, with private plunge pool solace at sunset.",
    whatYouGain: [
      "185 Mbps verified fiber: no frozen frames reported during 4-hour Zoom marathons.",
      "Acoustic sanctuary: tucked inside a residential cul-de-sac far from the beach road, waking only to morning birds.",
      "Private plunge pool and an ergonomic study chair that saves your lower back.",
    ],
    whatYouSacrifice: [
      "15-minute scooter drive through rural roads to reach Ao Nang's night markets and cafe strip.",
      "Dinner variety requires renting a scooter or waiting for Grab drivers on quiet Klong Muang lanes.",
    ],
    bestSuitedFor: "Digital nomads and remote workers whose client meetings and deep sleep are non-negotiable.",
    notIdealFor: "Solo backpackers seeking spontaneous beachfront bar crawls outside their front door.",
  },
  prop_krabi_02: {
    tradeOffNote: "Unbeatable 2-min pier proximity and low price, but loud bar music and fragile Wi-Fi.",
    cardVibe: "Electric pierfront salt breeze & late-night acoustic bass",
    cardFeeling: "Thrilled by 3-minute boat access and lively dive energy, but drained if you need quiet sleep before 1 AM.",
    drawerVibe: "High-octane pierfront salt spray & late-night acoustic bass",
    drawerFeeling: "Energised by 3-minute boat departures and lively dive-hub energy, but worn out if you need quiet sleep before 1:00 AM.",
    whatYouGain: [
      "Doorstep logistics: 3 PADI 5-star dive shops downstairs, longtail pickups 3 minutes away.",
      "Strong budget value at $72/night with an outdoor rinse tank for wetsuits and BCD gear.",
      "Balcony views of longtail boats against Ao Nang's limestone headlands.",
    ],
    whatYouSacrifice: [
      "Night noise: the live music bar across the alley plays bass until 1:00 AM.",
      "Shared hotel Wi-Fi dropped twice during a guest's team standup, making video calls risky.",
    ],
    bestSuitedFor: "Scuba divers on dawn boat itineraries who fall asleep easily and aren't working on the trip.",
    notIdealFor: "Remote workers, light sleepers, or anyone managing calls across time zones.",
  },
  prop_krabi_03: {
    tradeOffNote: "Stunning limestone peacefulness, but lacks an ergonomic desk and Wi-Fi lags in storms.",
    cardVibe: "Towering limestone amphitheater & tropical morning mist",
    cardFeeling: "Completely grounded and disconnected from urban stress, though antsy if you need a high-speed video upload.",
    drawerVibe: "Karst-cliff amphitheater & car-free tropical mist",
    drawerFeeling: "Unhurried and grounded in natural scenery; contemplative rather than corporate.",
    whatYouGain: [
      "Car-free calm: no motorbikes or cars on Railay, just lagoon breezes and birdcalls.",
      "8-minute boardwalk walk beneath the cliffs to Railay Dive Center.",
      "Teak woodwork, garden verandas, and postcard limestone views.",
    ],
    whatYouSacrifice: [
      "Only a low coffee table, with no proper desk or task chair for laptop work.",
      "Peninsula internet (~25 Mbps) that lags during tropical rainstorms.",
    ],
    bestSuitedFor: "Writers, couples, and creatives seeking an unplugged nature escape with light email checking.",
    notIdealFor: "Engineers who need a multi-monitor setup or consistent upload bandwidth.",
  },
  prop_phuket_01: {
    tradeOffNote: "Exceptional co-working setup & 3-min pier walk, but boat harbor rather than soft sand beach.",
    cardVibe: "Purpose-built maritime efficiency & focused diver community",
    cardFeeling: "Unstoppable momentum: finishing 3 reef dives by afternoon and jumping straight into product calls with dual monitors.",
    drawerVibe: "Maritime efficiency & tech-forward focus at Chalong Marina",
    drawerFeeling: "Productive and balanced: dawn reef diving followed by evening sprint calls.",
    whatYouGain: [
      "3-minute walk to Chalong Pier, where day boats leave for Phi Phi and Racha at 7:30 AM.",
      "24/7 co-working lounge with plug-in monitors and 200 Mbps fiber.",
      "Double-glazed bedroom windows for quiet sleep despite harbor activity.",
    ],
    whatYouSacrifice: [
      "Chalong is a working marina, not a swimming beach.",
      "Kata or Nai Harn beaches are a 12-minute taxi over the ridge.",
    ],
    bestSuitedFor: "Working divers who need reliable fiber after a 3-dive day.",
    notIdealFor: "Travelers who want to step out of bed onto white sand.",
  },
  prop_phuket_02: {
    tradeOffNote: "Blazing 300 Mbps fiber & infinity pool serenity, but steep hillside requires 150cc scooter.",
    cardVibe: "Panoramic Andaman Sea infinity views & breezy hill silence",
    cardFeeling: "Inspiring retreat with total acoustic peace, provided you're comfortable riding a scooter up the steep hill.",
    drawerVibe: "Panoramic Andaman Sea elevation & quiet tropical luxury",
    drawerFeeling: "Elevated, private, and creatively inspired overlooking Rawai bay.",
    whatYouGain: [
      "~300 Mbps symmetric fiber, tested with zero packet loss during a 6-person sprint review.",
      "Infinity pool overlooking the Andaman Sea at sunset.",
      "Hilltop quiet among rubber trees and sea breeze.",
    ],
    whatYouSacrifice: [
      "Steep driveway that needs a 150cc scooter or rental car.",
      "About 10–11 minutes' drive down to the Chalong dive boats.",
    ],
    bestSuitedFor: "Founders, tech leads, and couples who want a high-end workcation with privacy.",
    notIdealFor: "Nervous drivers or pedestrians who dislike steep hills.",
  },
  prop_phuket_03: {
    tradeOffNote: "Direct surf beach access & cafe atmosphere, but 20-min daily commute to scuba boats.",
    cardVibe: "Golden-hour surf breaks & vibrant coastal cafe chatter",
    cardFeeling: "Carefree and sun-kissed with surfboards at the door, but slightly weary if commuting across the island daily for scuba boats.",
    drawerVibe: "Golden-hour surf breaks, iced espresso chatter & beachside ease",
    drawerFeeling: "Carefree and sun-kissed, but weary if commuting across the island daily.",
    whatYouGain: [
      "Barefoot access to Kata's sand and surfable waves.",
      "On-site cafe with good coffee and a social atmosphere.",
    ],
    whatYouSacrifice: [
      "20-minute taxi each way over the Kata hill to the Chalong dive boats ($15–20/day in Grab fares).",
      "Shared cafe Wi-Fi that struggles with heavy uploads during the lunch rush.",
    ],
    bestSuitedFor: "Surfers and social travelers who put wave access ahead of dawn dive boats.",
    notIdealFor: "Divers on multi-day boat itineraries who need punctual dawn transfers.",
  },
};
