/**
 * WanderGenie — Itinerary Generation Service
 *
 * Produces rich, personalized day-by-day travel plans, packing lists,
 * and weather summaries based on destination, budget, duration, and interests.
 *
 * Falls back to OpenAI if AI_PROVIDER=openai is set and OPENAI_API_KEY is provided.
 */

// ─── Destination data ────────────────────────────────────────────────────────

const DESTINATION_DATA = {
  goa: {
    region: "coastal",
    highlights: ["Baga Beach", "Old Goa churches", "Anjuna flea market", "Dudhsagar Falls"],
    cuisine: ["seafood thali", "bebinca", "feni cocktails", "prawn curry rice"],
    vibes: ["beach", "nightlife", "culture"],
    weather: { temperature: "30°C", condition: "Sunny", rainPrediction: "20% chance of rain", suggestion: "Pack sunscreen and light beach wear — it's gorgeous out there." },
  },
  bali: {
    region: "island",
    highlights: ["Tanah Lot temple", "Ubud rice terraces", "Seminyak beach clubs", "Sacred Monkey Forest"],
    cuisine: ["nasi goreng", "babi guling", "fresh coconut", "satay"],
    vibes: ["spiritual", "nature", "nightlife"],
    weather: { temperature: "29°C", condition: "Partly cloudy", rainPrediction: "35% chance of afternoon rain", suggestion: "Carry a compact umbrella — brief tropical showers are common." },
  },
  paris: {
    region: "european",
    highlights: ["Eiffel Tower", "Louvre Museum", "Montmartre", "Seine river cruise"],
    cuisine: ["croissants", "French onion soup", "crêpes", "escargot"],
    vibes: ["culture", "shopping", "cafes"],
    weather: { temperature: "18°C", condition: "Mild and overcast", rainPrediction: "45% chance of light rain", suggestion: "A light jacket and small umbrella will keep you comfortable." },
  },
  tokyo: {
    region: "asian",
    highlights: ["Shibuya Crossing", "Senso-ji Temple", "teamLab Planets", "Tsukiji market"],
    cuisine: ["ramen", "sushi", "yakitori", "matcha desserts"],
    vibes: ["culture", "shopping", "nightlife", "cafes"],
    weather: { temperature: "22°C", condition: "Clear skies", rainPrediction: "15% chance of rain", suggestion: "Perfect weather — just pack layers for cool evenings." },
  },
  manali: {
    region: "mountain",
    highlights: ["Rohtang Pass", "Hadimba Temple", "Solang Valley", "Old Manali cafes"],
    cuisine: ["Himachali dham", "trout fish", "siddu", "butter tea"],
    vibes: ["mountains", "adventure", "cafes"],
    weather: { temperature: "12°C", condition: "Cool and crisp", rainPrediction: "25% chance of rain or snow", suggestion: "Warm layers, waterproof boots, and a windproof jacket are a must." },
  },
  dubai: {
    region: "desert",
    highlights: ["Burj Khalifa", "Dubai Mall", "Desert safari", "Gold Souk"],
    cuisine: ["shawarma", "luqaimat", "camel milk", "mezze platter"],
    vibes: ["shopping", "nightlife", "adventure"],
    weather: { temperature: "35°C", condition: "Hot and sunny", rainPrediction: "5% chance of rain", suggestion: "Stay hydrated and wear breathable clothing — it's warm year-round." },
  },
  kerala: {
    region: "coastal",
    highlights: ["Alleppey backwaters", "Munnar tea estates", "Periyar wildlife sanctuary", "Fort Kochi"],
    cuisine: ["appam with stew", "Kerala fish curry", "puttu kadala", "banana chips"],
    vibes: ["nature", "culture", "beaches", "adventure"],
    weather: { temperature: "27°C", condition: "Humid and lush", rainPrediction: "55% chance of rain", suggestion: "Rain is part of the charm — waterproof sandals and a poncho are ideal." },
  },
  rajasthan: {
    region: "desert",
    highlights: ["Amber Fort", "Thar Desert safari", "Lake Pichola", "Mehrangarh Fort"],
    cuisine: ["dal baati churma", "laal maas", "pyaaz ki kachori", "mawa kachori"],
    vibes: ["culture", "adventure", "shopping"],
    weather: { temperature: "32°C", condition: "Dry and sunny", rainPrediction: "10% chance of rain", suggestion: "Light cotton clothes and a hat are perfect for the desert heat." },
  },
};

// ─── Activity templates by interest ──────────────────────────────────────────

const INTEREST_ACTIVITIES = {
  beaches: [
    "Morning swim and sun-soak at the main beach",
    "Explore sea caves or rock pools at low tide",
    "Sunset walk along the shoreline with a coconut in hand",
    "Snorkelling or water sports session",
    "Beach shack lunch — fresh catch of the day",
  ],
  cafes: [
    "Slow morning at a specialty pour-over café",
    "Visit a renowned local bakery for breakfast pastries",
    "Café-hopping through the arts district",
    "Afternoon high tea or dessert tasting",
    "Work-from-café session at a co-working space",
  ],
  nightlife: [
    "Pre-dinner cocktails at a rooftop bar",
    "Live music or jazz session at a local venue",
    "Night-market stroll with street food bites",
    "Dance the night away at a popular club",
    "Late-night ramen / street food wrap-up",
  ],
  adventure: [
    "White-water rafting or kayaking excursion",
    "Zip-lining or paragliding experience",
    "Sunrise trek to a panoramic viewpoint",
    "Mountain biking through scenic trails",
    "Rock climbing or bouldering session",
  ],
  mountains: [
    "Early morning hike to a mountain viewpoint",
    "Picnic in an alpine meadow",
    "Visit a high-altitude lake or waterfall",
    "Camp-fire evening under the stars",
    "Photography walk through pine forests",
  ],
  culture: [
    "Guided tour of the old town / heritage district",
    "Visit to a world-class museum or art gallery",
    "Attend a local festival, ceremony, or performance",
    "Cooking class featuring traditional cuisine",
    "Visit ancient temples, forts, or palaces",
  ],
  shopping: [
    "Morning at the local flea / artisan market",
    "Designer district walk and window shopping",
    "Handicraft workshop — make your own souvenir",
    "Visit a famous bazaar or covered market",
    "Antique hunting in the old quarters",
  ],
};

// ─── Packing list builder ────────────────────────────────────────────────────

function buildPackingList(destination, interests, budget, duration) {
  const destKey = destination.toLowerCase().replace(/[^a-z]/g, "");
  const destInfo = DESTINATION_DATA[destKey] || {};
  const region = destInfo.region || "generic";
  const isBeach = interests.includes("beaches") || region === "coastal" || region === "island";
  const isMountain = interests.includes("mountains") || region === "mountain";
  const isAdventure = interests.includes("adventure");
  const isCulture = interests.includes("culture");
  const isPremium = budget >= 50000;

  return [
    {
      name: "Clothing",
      items: [
        ...(isBeach ? ["Swimwear (2 sets)", "Beach cover-up / sarong"] : []),
        ...(isMountain ? ["Thermal inner layers", "Fleece jacket", "Waterproof trekking pants"] : []),
        "Light breathable tops (3–4)",
        "Comfortable walking pants / shorts",
        "One smart casual outfit for dining out",
        ...(isPremium ? ["Formal outfit for upscale restaurants"] : []),
        "Comfortable walking shoes / sneakers",
        ...(isAdventure ? ["Trekking / trail shoes"] : []),
        ...(isBeach ? ["Flip-flops"] : []),
      ],
    },
    {
      name: "Essentials",
      items: [
        "Passport / national ID + photocopies",
        "Travel insurance documents",
        "Credit/debit cards + some local cash",
        "Power bank (20,000 mAh recommended)",
        "Universal travel adapter",
        "Reusable water bottle",
        "Basic first-aid kit (plasters, paracetamol, antacid)",
        "Prescription medications + doctor note",
      ],
    },
    {
      name: "Tech & Accessories",
      items: [
        "Smartphone + charger",
        "Earbuds / headphones",
        ...(isPremium ? ["Mirrorless camera"] : ["Camera or phone tripod"]),
        "Sunglasses (UV400)",
        "Day backpack / tote bag",
        ...(duration > 5 ? ["Packing cubes"] : []),
        "Padlock for hostel lockers",
      ],
    },
    {
      name: "Weather & Hygiene",
      items: [
        ...(isBeach || region === "desert" ? ["Sunscreen SPF 50+", "After-sun lotion"] : []),
        ...(isMountain ? ["Lip balm SPF", "Hand warmers"] : []),
        "Compact umbrella / rain poncho",
        "Insect repellent",
        "Wet wipes & hand sanitiser",
        "Microfibre quick-dry towel",
        ...(isCulture ? ["Modest cover-up / scarf for religious sites"] : []),
      ],
    },
  ];
}

// ─── Smart itinerary builder ─────────────────────────────────────────────────

function buildItinerary(destination, duration, interests, budget) {
  const destKey = destination.toLowerCase().replace(/[^a-z]/g, "");
  const destInfo = DESTINATION_DATA[destKey] || {};
  const highlights = destInfo.highlights || [`${destination} old town`, `${destination} viewpoint`, `${destination} local market`];
  const cuisine = destInfo.cuisine || ["local cuisine", "street food", "regional specialities"];

  // Collect interest-specific activities
  const interestActivities = interests.flatMap((i) => INTEREST_ACTIVITIES[i] || []);
  const shuffled = interestActivities.sort(() => 0.5 - Math.random());

  const budgetLabel = budget < 15000 ? "budget-friendly" : budget < 50000 ? "mid-range" : "premium";

  const days = [];
  for (let i = 0; i < duration; i++) {
    const day = i + 1;
    let title, activities;

    if (day === 1) {
      title = `Day 1 — Arrival & First Impressions`;
      activities = [
        `Check in and freshen up at your ${budgetLabel} accommodation`,
        `Orientation walk through ${destination}'s main area`,
        `Welcome dinner featuring ${cuisine[0]} at a highly-rated local spot`,
      ];
    } else if (day === duration) {
      title = `Day ${day} — Highlights & Farewell`;
      activities = [
        `Revisit your favourite spot or pick up last-minute souvenirs`,
        `Final ${cuisine[Math.floor(Math.random() * cuisine.length)]} experience at ${destination}`,
        `Head to the airport / station — bon voyage!`,
      ];
    } else {
      const phaseLabels = ["Adventure & Discovery", "Culture & Flavours", "Hidden Gems", "Deep Dive", "Slow Travel Day"];
      title = `Day ${day} — ${phaseLabels[(day - 2) % phaseLabels.length]}`;

      const highlightActivity = highlights[(i - 1) % highlights.length];
      const interestAct1 = shuffled[(i * 2) % (shuffled.length || 1)] || `Explore ${destination}'s neighbourhood markets`;
      const interestAct2 = shuffled[(i * 2 + 1) % (shuffled.length || 1)] || `Evening at a popular ${cuisine[i % cuisine.length]} restaurant`;

      activities = [
        `Visit ${highlightActivity}`,
        interestAct1,
        interestAct2,
      ];
    }

    days.push({ day, title, activities });
  }
  return days;
}

// ─── Weather builder ─────────────────────────────────────────────────────────

function buildWeather(destination) {
  const destKey = destination.toLowerCase().replace(/[^a-z]/g, "");
  return (
    DESTINATION_DATA[destKey]?.weather || {
      temperature: "25°C",
      condition: "Partly cloudy",
      rainPrediction: "30% chance of rain",
      suggestion: "Pack a light jacket and compact umbrella just in case.",
    }
  );
}

// ─── OpenAI provider (optional) ──────────────────────────────────────────────

async function generateWithOpenAI(request) {
  const { destination, budget, duration, interests } = request;
  const prompt = `You are WanderGenie, an expert travel planner. Generate a detailed ${duration}-day itinerary for a trip to ${destination} with a budget of INR ${budget}. The traveller is interested in: ${interests.join(", ")}.

Respond ONLY with a JSON object (no markdown, no preamble) matching this schema:
{
  "itinerary": [{ "day": 1, "title": "Day 1 — ...", "activities": ["...", "...", "..."] }],
  "packing_list": [{ "name": "Category", "items": ["...", "..."] }],
  "weather": { "temperature": "...", "condition": "...", "rainPrediction": "...", "suggestion": "..." }
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ─── Main export ─────────────────────────────────────────────────────────────

async function generateItinerary(request) {
  const { destination, budget, duration, interests } = request;
  const start = Date.now();

  let result;

  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    try {
      result = await generateWithOpenAI(request);
    } catch (err) {
      console.warn("OpenAI failed, falling back to built-in generator:", err.message);
      result = {
        itinerary: buildItinerary(destination, duration, interests, budget),
        packing_list: buildPackingList(destination, interests, budget, duration),
        weather: buildWeather(destination),
      };
    }
  } else {
    result = {
      itinerary: buildItinerary(destination, duration, interests, budget),
      packing_list: buildPackingList(destination, interests, budget, duration),
      weather: buildWeather(destination),
    };
  }

  return { ...result, generationDurationMs: Date.now() - start };
}

module.exports = { generateItinerary };
