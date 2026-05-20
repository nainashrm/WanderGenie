/**
 * WanderGenie — Groq AI Service  (v3 — Destination-Specific Fix)
 * ───────────────────────────────────────────────────────────────
 *
 * ROOT CAUSES FIXED IN THIS VERSION
 * ──────────────────────────────────
 * 1. `response_format: { type: "json_object" }` was MISSING from every
 *    Groq call → Groq returned prose/markdown → JSON.parse failed →
 *    silently fell back to the hardcoded generic template.
 *    FIX: Added to callGroq().
 *
 * 2. MAX_TOKENS = 4096 caused mid-JSON truncation on long itineraries.
 *    A truncated object fails JSON.parse → triggers fallback silently.
 *    FIX: Raised to 8000. Added token-usage logging to catch future issues.
 *
 * 3. No destination context was injected into prompts. The model had
 *    nothing anchoring it to real places, so produced generic text.
 *    FIX: DESTINATION_SEEDS injects real beaches, restaurants, streets,
 *    activities for every major destination directly into the prompt.
 *
 * 4. extractJSON had no truncation repair. A half-written JSON object
 *    caused a throw → fell back silently.
 *    FIX: Multi-pass repair: strip fences → isolate object → strip
 *    trailing commas → count and close open brackets.
 *
 * 5. Prompts were too schema-heavy, wasting tokens on field definitions
 *    instead of destination knowledge.
 *    FIX: Simplified schema, shorter system prompt, richer user prompt.
 *
 * 6. fallbackService.js used a generic INTEREST_POOL (not destination-
 *    specific), so even the fallback was generic for unknown destinations.
 *    FIX: fallbackService rebuilt with per-destination activity pools.
 */

"use strict";

const Groq = require("groq-sdk");
const { buildFallbackItinerary } = require("./fallbackService");

// ─── Groq client (lazy — safe to import without key set) ──────────────────────
let _groq = null;
function getClient() {
  if (_groq) return _groq;
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env file. " +
      "Get a free key at https://console.groq.com"
    );
  }
  _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const GROQ_MODEL  = process.env.GROQ_MODEL       || "llama-3.3-70b-versatile";
const MAX_TOKENS  = parseInt(process.env.GROQ_MAX_TOKENS)  || 8000;  // was 4096 — caused truncation
const TEMPERATURE = parseFloat(process.env.GROQ_TEMPERATURE) || 0.65; // slightly lower = more consistent JSON

// ─── JSON extraction with multi-pass repair ───────────────────────────────────
/**
 * Safely extract a JSON object from raw LLM output.
 * Handles: markdown fences, stray preamble/postamble text,
 * trailing commas, and truncated (incomplete) JSON.
 */
function extractJSON(raw) {
  if (!raw || typeof raw !== "string") throw new Error("Empty Groq response");

  // Pass 1: strip markdown code fences
  let text = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  // Pass 2: isolate outermost { ... }
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`No JSON object in Groq response. Preview: "${text.slice(0, 150)}"`);
  }
  text = text.slice(start, end + 1);

  // Pass 3: direct parse (the happy path)
  try { return JSON.parse(text); } catch { /* continue */ }

  // Pass 4: remove trailing commas before ] or }  (most common LLM mistake)
  try {
    const fixed = text.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(fixed);
  } catch { /* continue */ }

  // Pass 5: truncated JSON repair — close all dangling structures
  try {
    let fixed = text;
    // Drop trailing incomplete key/value after the last clean comma
    fixed = fixed.replace(/,\s*"[^"]*$/, "");   // incomplete key
    fixed = fixed.replace(/,\s*$/, "");           // trailing comma
    // Count and close open brackets
    const openBrackets = (fixed.match(/\[/g) || []).length - (fixed.match(/]/g) || []).length;
    const openBraces   = (fixed.match(/{/g)  || []).length - (fixed.match(/}/g)  || []).length;
    for (let i = 0; i < openBrackets; i++) fixed += "]";
    for (let i = 0; i < openBraces;   i++) fixed += "}";
    return JSON.parse(fixed);
  } catch (e) {
    throw new Error(`JSON repair failed: ${e.message}. Raw (first 400): ${text.slice(0, 400)}`);
  }
}

// ─── Core Groq caller ─────────────────────────────────────────────────────────
/**
 * @param {string}  system      System prompt
 * @param {string}  user        User prompt
 * @param {number}  [maxTok]    Token override for this call
 * @param {number}  [retries=2] Retry count on transient errors
 */
async function callGroq({ system, user, maxTok = MAX_TOKENS, retries = 2 }) {
  const client = getClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model:           GROQ_MODEL,
        max_tokens:      maxTok,
        temperature:     TEMPERATURE,
        response_format: { type: "json_object" },  // ← THE CORE FIX (was missing entirely)
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      });

      const content = completion.choices?.[0]?.message?.content ?? "";

      // Log token usage so we can catch near-limit truncation in production
      if (completion.usage) {
        const u = completion.usage;
        console.log(
          `[Groq] prompt=${u.prompt_tokens} completion=${u.completion_tokens} ` +
          `total=${u.total_tokens} model=${GROQ_MODEL}`
        );
        if (u.completion_tokens >= maxTok - 200) {
          console.warn(
            `[Groq] ⚠️  Response near token ceiling ` +
            `(${u.completion_tokens}/${maxTok}) — consider raising GROQ_MAX_TOKENS`
          );
        }
      }

      return content;
    } catch (err) {
      const retryable =
        err?.status === 429 || err?.status >= 500 || err?.code === "ETIMEDOUT";
      if (attempt < retries && retryable) {
        const wait = 1200 * (attempt + 1);
        console.warn(`[Groq] attempt ${attempt + 1} failed (${err.status ?? err.code}), retrying in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

// ─── Budget classifier ────────────────────────────────────────────────────────
function classifyBudget(budget, duration) {
  const perDay = Math.round(budget / duration);
  if (perDay < 1500)  return { label: "ultra-budget backpacker", tier: "budget",  perDay, accom: "hostel dorm (₹400–900/night)",        food: "street food & dhabas (₹80–200/meal)"      };
  if (perDay < 4000)  return { label: "budget traveller",        tier: "budget",  perDay, accom: "budget hotel (₹800–2500/night)",       food: "local restaurants (₹150–400/meal)"        };
  if (perDay < 10000) return { label: "mid-range traveller",     tier: "mid",     perDay, accom: "3-star hotel (₹2500–6000/night)",      food: "casual dining (₹300–800/meal)"            };
  if (perDay < 25000) return { label: "comfortable traveller",   tier: "comfort", perDay, accom: "4-star hotel (₹6000–15000/night)",     food: "upscale casual (₹800–2000/meal)"          };
  return               { label: "luxury traveller",              tier: "luxury",  perDay, accom: "5-star resort (₹15000+/night)",        food: "fine dining (₹2000+/meal)"                };
}

// ─── Destination seed data ────────────────────────────────────────────────────
/**
 * Real, verified local knowledge injected directly into the AI prompt.
 * This is the PRIMARY fix for generic output: grounding the model with
 * destination-specific facts it can reference instead of inventing generic text.
 *
 * Structure: { areas, landmarks, restaurants, activities, hotels, transport, season }
 */
const DESTINATION_SEEDS = {
  // ── INDIA ──────────────────────────────────────────────────────────────────
  goa: {
    areas:       "North Goa (Calangute, Baga, Anjuna, Vagator, Candolim) • South Goa (Palolem, Colva, Agonda) • Panaji (capital) • Old Goa (UNESCO heritage)",
    landmarks:   "Baga Beach, Anjuna Beach, Calangute Beach, Vagator Beach, Palolem Beach, Arambol Beach, Anjuna Flea Market (every Wednesday), Chapora Fort, Basilica of Bom Jesus (UNESCO), Se Cathedral, Fort Aguada, Dudhsagar Falls (day trip, 60 km), Fontainhas Latin Quarter (Panaji)",
    restaurants: "Vinayak Family Restaurant (North Goa, seafood thali ₹250), Britto's (Baga Beach, fish curry rice ₹350), Thalassa (Vagator, Greek-Goan fusion, ₹800), Gunpowder (Assagao, Kerala-Goan, ₹600), Fisherman's Wharf (Cavelossim, grilled prawns ₹700), A Reverie (Calangute, fine dining, ₹1500), Infantaria (Calangute, breakfast pastries ₹200), Ritz Classic (Panaji, chorizo pao ₹120)",
    activities:  "Scuba diving Grande Island with Barracuda Diving (₹3500), parasailing Baga Beach (₹700), jet-ski Calangute (₹600/15 min), dolphin cruise Candolim jetty (₹300), sunset river cruise Mandovi River (₹400), spice plantation tour Ponda with lunch (₹600), cooking class Assagao (₹1500), heritage walk Fontainhas (₹200 guide), Tito's Lane bar-hop Baga (from 10 PM), LPK Waterfront club Candolim, Curlies beach shack Anjuna",
    hotels:      "Budget: Zostel Goa Palolem (₹600 dorm), Hotel Golden Sands Calangute (₹1200) • Mid: Casa de Goa Calangute (₹2500), La Calypso Candolim (₹3200) • Luxury: Taj Exotica Benaulim (₹18000), W Goa Vagator (₹22000)",
    transport:   "Scooter rental Mall Road ₹300-400/day (essential), Ola/Uber available but surges, local buses ₹10-20, taxis ₹300-800/trip",
    season:      "Peak: Oct–Mar (28–34°C, sunny). Avoid: Jun–Sep (monsoon). Shoulder: Apr–May (hot, 35°C+)",
  },
  manali: {
    areas:       "Old Manali (cafes, hippie vibe, 3 km from Mall Road) • Mall Road (main tourist strip) • Vashisht (hot springs, local village) • Solang Valley (14 km, adventure sports) • Rohtang Pass (51 km, high altitude)",
    landmarks:   "Rohtang Pass (3978 m, permit required ₹550 online), Solang Valley, Hadimba Devi Temple (cedar forest, free), Old Manali street walk, Vashisht Hot Springs (₹10 entry), Jogini Waterfall (2 hr trek from Vashisht), Naggar Castle & Roerich Art Gallery (25 km), Beas River, Kullu Valley viewpoints",
    restaurants: "Café 1947 (Old Manali, wood-fired pizza + thukpa ₹200), Johnson's Café (Mall Road, continental breakfast ₹350), Drifter's Café (Old Manali, pancakes ₹180), Dylan's Toasted & Roasted (Old Manali, filter coffee ₹100), Shiva Café (Vashisht, momos + views ₹150), Chopsticks (Mall Road, Chinese-Tibetan ₹250), The Lazy Dog Café (Old Manali, bonfire evenings)",
    activities:  "Paragliding Solang Valley tandem (₹2500), white-water rafting Beas River May–Jun (₹600), mountain biking rental Mall Road (₹500/day), Beas Kund trek 3 days (guide ₹1500/day), Hampta Pass trek 4 days, snow activities Rohtang Dec–Mar (₹200–500 per activity), Vashisht natural hot springs dip, Naggar Castle heritage tour, stargazing campfire Solang Valley (₹800 all-in)",
    hotels:      "Budget: Zostel Manali Old Manali (₹550 dorm), Old Manali Cottage (₹900) • Mid: Snow Valley Resorts (₹2800), Manu Allaya (₹3500) • Luxury: Span Resort & Spa (₹9000), Solang Valley Resort (₹12000)",
    transport:   "Local taxis from Mall Road (fixed govt rates), scooter/bike rental (₹150/hr), no Uber/Ola, Rohtang permit must be booked online 2 days ahead",
    season:      "Best: May–Jun (12–22°C, open roads), Sep–Oct (clear views, 5–15°C). Snow: Dec–Feb (-10 to 5°C). Avoid: Jul–Aug (landslides)",
  },
  kerala: {
    areas:       "Fort Kochi / Mattancherry (heritage, cafes) • Alleppey / Alappuzha (backwaters, houseboats) • Munnar (tea estates, hills) • Wayanad (wildlife, forests) • Varkala (cliff beach) • Kovalam (beach resort) • Thekkady / Periyar (wildlife)",
    landmarks:   "Alleppey Houseboat overnight cruise, Munnar Tea Museum & Eravikulam National Park, Fort Kochi Chinese fishing nets, Mattancherry Palace (Dutch Palace), Paradesi Synagogue, Periyar Wildlife Sanctuary Thekkady, Varkala cliff beach & natural spring, Athirapally Waterfalls (60 km from Kochi), Bekal Fort, Kumarakom bird sanctuary",
    restaurants: "Dhe Puttu (Kochi, puttu & appam ₹150), Dal Roti (Fort Kochi, budget Kerala homestyle ₹120), Oceanos (Fort Kochi, seafood ₹600), Malabar Junction (Kochi hotel restaurant, ₹800), Kashi Art Café (Fort Kochi, breakfast ₹300), Paragon Restaurant (Kozhikode, biryani ₹250), Maria's Kitchen (Alleppey, sadhya banana leaf ₹300)",
    activities:  "Houseboat overnight cruise Alleppey (₹8000–12000 for 2 pax), Periyar boat safari spot elephants (₹200), bamboo rafting Periyar (₹1000), Kathakali dance show Fort Kochi 7 PM (₹350), Kalaripayattu martial arts demo CNK Kalari Fort Kochi (₹300), Kerala cooking class Fort Kochi (₹1500), ayurvedic massage 90 min (₹2000), Athirapally waterfall half-day, tea factory tour Munnar (₹100), Fort Kochi heritage walk (free)",
    hotels:      "Budget: Zostel Fort Kochi (₹700 dorm) • Mid: CGH Earth Brunton Boatyard (₹9000), Fragrant Nature Backwater Resort (₹5000) • Luxury: Kumarakom Lake Resort (₹22000), CGH Earth Coconut Lagoon (₹18000)",
    transport:   "KSRTC buses ₹20–80 (cheapest), autos widely available, Fort Kochi–Ernakulam ferry ₹4, houseboats booked from Alleppey jetty",
    season:      "Best: Oct–Feb (24–33°C, low humidity). Monsoon magic: Jun–Sep. Avoid: Mar–May (38°C, very humid)",
  },
  rajasthan: {
    areas:       "Jaipur – Pink City (capital, 6 hr from Delhi) • Jodhpur – Blue City • Udaipur – City of Lakes • Jaisalmer – Golden City • Pushkar – pilgrim town • Ranthambore – tiger reserve",
    landmarks:   "Amber Fort Jaipur (light & sound show ₹100), Hawa Mahal, Jantar Mantar UNESCO, Mehrangarh Fort Jodhpur (best fort India, ₹600 audio guide), City Palace Udaipur, Lake Pichola boat ride (₹400), Jaisalmer Fort (living fort, free), Sam Sand Dunes Jaisalmer, Pushkar Lake & Brahma Temple, Ranthambore tiger safari",
    restaurants: "LMB – Laxmi Misthan Bhandar Jaipur (dal baati churma since 1954, ₹350), Gypsy Jaipur (rooftop, Rajasthani thali ₹500), Mehran Terrace Jodhpur fort compound (views, ₹600), Janta Sweet Home Jodhpur (mirchi bada ₹30), Ambrai Udaipur (lakeside, romantic, ₹1200 for two), Trio Restaurant Jaisalmer (rooftop fort views, thali ₹400), Hotel Natraj Ajmer (unlimited dal-baati ₹180)",
    activities:  "Camel safari Sam Sand Dunes overnight (₹2500 all-in), hot air balloon Jaipur sunrise Skywaltz (₹8000), Ranthambore tiger jeep safari (₹3000, book 2 months ahead), block printing workshop Sanganer Jaipur (₹800), blue pottery workshop Jaipur (₹600), Chokhi Dhani folk village dinner (₹900 all-in), Johari Bazaar gems shopping, Jaipur heritage walk (₹500 guide), Thar Desert overnight camping Jaisalmer",
    hotels:      "Budget: Zostel Jaipur (₹500 dorm), Hotel Pearl Palace Jaipur rooftop café (₹1200) • Mid: Alsisar Haveli Jaipur (₹4000), Raas Jodhpur (₹7000) • Luxury: Taj Lake Palace Udaipur floating palace (₹30000), Suján Sher Bagh Ranthambore (₹45000)",
    transport:   "Hire car + driver ₹2000–3000/day (best for multi-city), Jaipur–Jodhpur–Jaisalmer–Udaipur circuit by train scenic, autos fixed govt rate in cities",
    season:      "Best: Oct–Mar (10–28°C, dry). Avoid: Apr–Jun (35–48°C extreme heat). Monsoon: Jul–Sep (light, manageable)",
  },
  delhi: {
    areas:       "Old Delhi (Chandni Chowk, Red Fort, Jama Masjid) • New Delhi (India Gate, CP, Lutyens) • South Delhi (Hauz Khas, Mehrauli, Saket) • Gurugram (nightlife, malls)",
    landmarks:   "Red Fort (Lal Qila, ₹35), Qutub Minar complex UNESCO (₹40), Humayun's Tomb UNESCO (₹40), Jama Masjid India's largest mosque (free), Chandni Chowk market lanes, India Gate (free, evening stroll), Lotus Temple (free), Akshardham Temple (free, no phones), Hauz Khas Village, National Museum Janpath (₹20)",
    restaurants: "Karim's (Old Delhi near Jama Masjid, mutton korma since 1913, ₹400), Paranthe Wali Gali Old Delhi (stuffed paranthas ₹80), Moti Mahal Daryaganj (butter chicken birthplace, ₹600), Saravana Bhavan CP (South Indian, ₹300), Gulati Pandara Road (Mughlai, open late, ₹700), Indian Accent (fine dining, ₹4000), Natraj Dahi Bhalla Wala Chandni Chowk (₹60)",
    activities:  "Old Delhi food walk Chandni Chowk (Airbnb Exp ₹1500), cycle tour Lutyens' Delhi (Pedal Yatri ₹1200), Red Fort light & sound show (₹80), Dilli Haat craft market INA (₹30 entry), Sarojini Nagar fashion shopping, Janpath Lane souvenirs, Delhi Metro Day Pass ₹150, Dharavi-style Nizamuddin dargah evening qawwali (free)",
    hotels:      "Budget: Zostel Delhi Paharganj (₹600 dorm), Hotel Tara Palace (₹1000) • Mid: The Claridges (₹7000), The Park CP (₹6500) • Luxury: The Imperial (₹25000), ITC Maurya (₹20000)",
    transport:   "Delhi Metro Day Pass ₹150 (fastest), Uber/Ola everywhere, autos via Rapido app, avoid airport hawker taxis",
    season:      "Best: Oct–Mar (8–25°C). Avoid: May–Jun (38–48°C extreme). Monsoon: Jul–Sep (humid, flooding)",
  },
  mumbai: {
    areas:       "South Mumbai (Colaba, Fort, Marine Drive, CST) • Bandra (cafes, boutiques, nightlife) • Juhu (beach, Bollywood) • Lower Parel (malls, rooftop bars) • Dharavi",
    landmarks:   "Gateway of India (free, boat to Elephanta ₹240 return), Elephanta Caves UNESCO (boat from Gateway), Marine Drive (Queen's Necklace at night, free), CST Station UNESCO (exterior), Dharavi slum tour Reality Tours (₹850), Haji Ali Dargah (tidal island, free), Siddhi Vinayak Temple (5:30 AM no queue), Crawford Market (Mahatma Phule Market)",
    restaurants: "Leopold Café Colaba (continental institution since 1871, ₹600), Britannia & Co Ballard Estate (Berry Pulao, Parsi, ₹500), Trishna Fort (butter pepper garlic crab, ₹1500), Bade Miya Colaba (seekh kababs street stall, ₹200), Mahesh Lunch Home Fort (Mangalorean seafood, ₹800), Lucky Restaurant Bandra (Mughlai biryani, ₹400), Café Mondegar Colaba (jukebox, cold beer, ₹500)",
    activities:  "Dharavi tour Reality Tours half-day (₹850), Elephanta Caves boat trip (₹240 ferry + ₹40 entry), Bollywood Film City tour Goregaon (₹2000), local train experience (₹10 any distance), Juhu Beach bhajia breakfast dawn (₹30/plate), Colaba Causeway souvenir shopping, Marine Drive sunset walk (free), Girgaon Chowpatty bhelpuri (₹50)",
    hotels:      "Budget: Zostel Mumbai Colaba (₹700 dorm), Hotel Bentley's (₹1500) • Mid: Gordon House Hotel Colaba (₹5000), Trident Nariman Point (₹8000) • Luxury: Taj Mahal Palace Colaba (₹30000), St. Regis Lower Parel (₹18000)",
    transport:   "Local train ₹10–30 (fastest, avoid 9–11 AM & 6–9 PM rush), Uber/Ola everywhere, ferry Gateway to Elephanta (₹240)",
    season:      "Best: Oct–Feb (25–33°C). Avoid: Jun–Sep (heavy monsoon, flooding). Hot: Mar–May (32–38°C)",
  },

  // ── INTERNATIONAL ──────────────────────────────────────────────────────────
  bali: {
    areas:       "Seminyak/Kuta (beach, party, shopping) • Ubud (culture, rice terraces, art) • Canggu (surf, hipster cafes) • Uluwatu (cliff temples, surf) • Nusa Dua (luxury resorts) • Amed (diving)",
    landmarks:   "Tegallalang Rice Terraces Ubud (sunrise 6 AM, ₹500 IDR entry), Tanah Lot Temple (sunset, iconic), Sacred Monkey Forest Ubud (₹80k IDR), Uluwatu Cliff Temple + Kecak fire dance 6 PM (₹150k IDR), Tirta Empul Holy Spring purification (₹50k IDR), Mount Batur sunrise trek 4 AM (guide included ₹500k IDR), Besakih Mother Temple, Nusa Penida day trip Kelingking Beach",
    restaurants: "Locavore Ubud (farm-to-table fine dining, book 3 weeks ahead, ₹3000/person), Ibu Oka Ubud (babi guling institution, lunch only, ₹150k IDR), Naughty Nuri's Ubud (fall-off-bone ribs, ₹200k IDR), Mama San Seminyak (Southeast Asian tapas, ₹800k IDR for two), Single Fin Uluwatu (sunset drinks + burgers, ₹200k IDR), Crate Café Canggu (best breakfast, ₹150k IDR), Sardine Seminyak (rice field views, fine dining, ₹600k IDR for two)",
    activities:  "Mount Batur sunrise trek (₹500k IDR all-in guide), Ayung River white-water rafting (₹400k IDR 2 hrs), scuba diving Amed or Nusa Penida (₹800k IDR), surf lesson Batu Bolong Canggu (₹300k IDR 2 hrs), Kecak fire dance Uluwatu (book online ₹150k IDR), Balinese cooking class Ubud market tour (₹600k IDR full day), Nusa Penida day trip manta rays snorkel (₹500k IDR), Ubud rice terrace cycling (₹200k IDR)",
    hotels:      "Budget: Lumbung Sari Hostel Ubud (₹800 dorm), Kabak Bali Canggu (₹1000) • Mid: Alaya Resort Ubud (₹4500), The Layar villas Seminyak (₹7000) • Luxury: Four Seasons Jimbaran (₹30000), COMO Uma Ubud (₹20000)",
    transport:   "Scooter rental ₹200–300/day (essential), Grab app (SE Asia Uber) widely available, Blue Bird metered taxis from airport",
    season:      "Dry best: Apr–Sep (27–32°C, clear). Wet: Oct–Mar (26–30°C, afternoon rains). Peak tourist: Jul–Aug",
  },
  paris: {
    areas:       "1st–4th arr. (Louvre, Marais, Notre-Dame, Île de la Cité) • 5th–6th arr. (Latin Quarter, Saint-Germain-des-Prés) • 8th arr. (Champs-Élysées, Arc de Triomphe) • 18th arr. (Montmartre, Sacré-Cœur) • 10th–11th arr. (Canal Saint-Martin, hip bars)",
    landmarks:   "Eiffel Tower (book summit online, go at dusk, €29), Louvre Museum (pre-book skip-line €17, half day minimum), Musée d'Orsay (Impressionists Monet Van Gogh, €16), Montmartre & Sacré-Cœur (free, cobblestone village), Sainte-Chapelle stained glass (book ahead €13), Versailles day trip RER C (€20 entry + €10 train), Centre Pompidou modern art (€14), Marché des Enfants Rouges oldest covered market (free)",
    restaurants: "Chez L'Ami Jean 7th arr. (Basque cuisine, book 2 weeks ahead, €50/person), Septime 11th arr. (neo-bistro, book 3 weeks ahead, €80), Café de Flore 6th arr. (literary institution since 1887, €15 coffee & croissant), L'As du Fallafel Marais (best falafel Paris, always queue, €7), Berthillon Île Saint-Louis (legendary ice cream since 1954, €4/scoop), Au Pied de Cochon 1st arr. (24 hr brasserie, onion soup €16), Ladurée 8th (original macaron house 1862, €3/macaron)",
    activities:  "Seine River cruise Bateaux Mouches (€15, 1 hr), Moulin Rouge dinner show (book 1 month ahead, €180), Paris food market Marché Bastille (Th/Sun, free), croissant baking class Cuisine du Chef (€90), Marché aux Puces Saint-Ouen flea market (weekends, free entry), Canal Saint-Martin evening bar walk (10th arr.), Père Lachaise cemetery (free, map essential), night cycling Seine Fat Tire Tours (€45)",
    hotels:      "Budget: Generator Paris 10th arr. (₹1500 dorm) • Mid: Hôtel Atmosphères 5th arr. (₹8000) • Luxury: Le Meurice 1st arr. (₹45000), Le Bristol 8th (₹55000)",
    transport:   "Navigo Easy card €15 deposit (unlimited metro/bus), metro lines 1/4/9/14 cover all major sites, Vélib bike day pass €5, walk as much as possible",
    season:      "Best: Apr–Jun, Sep–Oct (15–22°C, sunny). Summer: Jul–Aug (22–30°C, crowded). Winter: Nov–Mar (5–10°C, grey but charming)",
  },
  tokyo: {
    areas:       "Shinjuku (neon, nightlife, station hub) • Shibuya (shopping, crossing, youth culture) • Asakusa (Senso-ji, old Tokyo, traditional) • Harajuku (fashion, Takeshita St) • Ginza (luxury retail) • Akihabara (anime, electronics) • Roppongi (art, nightlife)",
    landmarks:   "Senso-ji Temple Asakusa (arrive 5 AM before crowds, free), Shibuya Crossing (rush hour 8–9 AM best, free), teamLab Borderless or Planets digital art (book 2 weeks ahead, ¥3300), Meiji Jingu Shrine Harajuku (forest walk, free), Tokyo Skytree 634 m views (¥2100), Tsukiji Outer Market breakfast sushi by 8 AM, Shinjuku Gyoen garden (¥500), Akihabara electronics & anime district",
    restaurants: "Ichiran Ramen any branch (solo booth tonkotsu, open 24 hr, ¥1000), Sushi Dai Tsukiji Outer Market (1 hr queue omakase, ¥4000), Afuri Harajuku (yuzu shio ramen, ¥1200), Gonpachi Nishiazabu (Kill Bill izakaya, ¥3000), Katsukura Shinjuku Isetan (tonkatsu perfection, ¥1800), Kagari Ginza (chicken paitan ramen queue, ¥1100)",
    activities:  "teamLab digital art (¥3300, book online 2 weeks), Senso-ji + Nakamise shopping street morning walk, Shinjuku Golden Gai bar-hop 50+ tiny bars from 6 PM (¥1000/bar), Harajuku Takeshita Street kawaii & crepes, Tsukiji Outer Market food walk 8 AM, day trip Nikko UNESCO 2 hr by Tobu train (¥2700), day trip Kamakura Giant Buddha 1 hr JR (¥700), Robot Restaurant Shinjuku (₹8000 tourist spectacle)",
    hotels:      "Budget: Khaosan Tokyo Kabuki Asakusa (₹1500 dorm), Millennials Shibuya pod (₹2000) • Mid: Park Hotel Tokyo Shiodome (₹9000), Andaz Shinjuku (₹12000) • Luxury: Aman Tokyo (₹65000), The Peninsula (₹50000), Park Hyatt Shinjuku Lost in Translation (₹35000)",
    transport:   "Suica IC card (¥500 deposit, tap metro/JR), metro ¥170–310/ride, JR Pass for day trips, no Uber use JapanTaxi app, Google Translate camera for menus",
    season:      "Best: Mar–Apr (cherry blossom 15–20°C), May–Jun, Sep–Nov (15–25°C). Hot humid: Jul–Aug. Cold: Dec–Feb (3–12°C)",
  },
  dubai: {
    areas:       "Downtown Dubai (Burj Khalifa, Dubai Mall) • Dubai Marina & JBR (waterfront, beach) • Old Dubai / Deira (souks, Creek) • Palm Jumeirah • DIFC (finance, upscale dining) • Business Bay",
    landmarks:   "Burj Khalifa 124th floor (book sunset slot online AED149), Dubai Mall world's largest (aquarium, ice rink, fountain show 6 PM daily free), Dubai Creek Gold Souk & Spice Souk Deira (free), Desert Safari dune bashing + BBQ dinner (AED200 book via Viator), Al Fahidi Historical Neighbourhood (free), Dubai Frame AED50, Jumeirah Mosque guided tour AED35, Palm Jumeirah monorail AED20",
    restaurants: "Al Ustad Special Kabab Deira (Iranian kebabs since 1978, AED40/person), Bu Qtair Jumeirah Beach (fried fish shack cash only, AED60), Ravi Restaurant Satwa (Pakistani 24 hr, AED15, backpacker legend), Logma DIFC Mall (Emirati breakfast chebab AED45), Pierchic Al Qasr (overwater seafood romantic, AED400 for two), Zuma DIFC (Japanese robata AED500 per person), 3 Fils Jumeirah Fishing Harbour (best restaurant Dubai)",
    activities:  "Desert safari dune bashing + camel + BBQ stars (AED200 all-in), skydiving Palm Jumeirah iFly Dubai (AED999), Ski Dubai indoor slope Mall of Emirates (AED250), abra water taxi Dubai Creek (AED2 iconic), speedboat tour past Atlantis & Burj Al Arab (AED150), hot air balloon over desert (AED895), Old Dubai food walk Al Rigga area (shawarma AED5, luqaimat AED3)",
    hotels:      "Budget: XVA Art Hotel Al Fahidi (₹4000) • Mid: Zabeel House by Jumeirah (₹7000), Aloft Palm Jumeirah (₹8000) • Luxury: Atlantis The Palm (₹30000), Burj Al Arab (₹80000+)",
    transport:   "Dubai Metro Red/Green lines Day Pass AED25/₹600, taxis metered reliable (AED12 start), Careem/Uber everywhere, avoid walking midday May–Oct",
    season:      "Best: Nov–Apr (20–28°C perfect). Extreme heat: May–Oct (35–45°C, outdoor activities morning/evening only)",
  },
};

/**
 * Returns a curated destination context block to embed in the prompt.
 * For destinations not in DESTINATION_SEEDS, returns empty string —
 * the LLM uses its general knowledge but is still told to be specific.
 */
function getDestinationSeed(destination) {
  const key = destination.toLowerCase().replace(/[^a-z]/g, "");

  // Exact match
  let seed = DESTINATION_SEEDS[key];

  // Partial match (e.g. "North Goa" → "goa", "South Bali" → "bali")
  if (!seed) {
    const partialKey = Object.keys(DESTINATION_SEEDS).find(
      k => key.includes(k) || k.includes(key.slice(0, 5))
    );
    if (partialKey) seed = DESTINATION_SEEDS[partialKey];
  }

  if (!seed) return "";

  return `
━━━ VERIFIED LOCAL KNOWLEDGE FOR ${destination.toUpperCase()} ━━━
USE THESE REAL PLACES — do not substitute generic phrases.

AREAS: ${seed.areas}
LANDMARKS & BEACHES: ${seed.landmarks}
RESTAURANTS (real, with prices): ${seed.restaurants}
ACTIVITIES (real, with prices): ${seed.activities}
HOTELS (real, with prices): ${seed.hotels}
LOCAL TRANSPORT: ${seed.transport}
BEST SEASON: ${seed.season}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const ITINERARY_SYSTEM = `You are WanderGenie, a world-class travel planner with encyclopedic local knowledge.

ABSOLUTE OUTPUT RULES:
1. Return ONLY a valid JSON object — zero text before or after.
2. Use REAL, SPECIFIC place names from the destination. No generic phrases.
3. BANNED phrases (never use): "local market", "old quarter", "waterfront café",
   "central area", "morning stroll", "popular restaurant", "nice café", "scenic viewpoint".
4. Every restaurant must be a real place with its actual name.
5. Every hotel must match the user's budget tier.
6. Itinerary must be geographically logical — cluster nearby activities per day.
7. Do NOT truncate — complete every array and nested object.

JSON SCHEMA (mandatory — follow exactly):
{
  "overview": {
    "destination": "string",
    "bestTimeToVisit": "string",
    "currency": "string",
    "language": "string",
    "quickTips": ["string", "string", "string"]
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 — [Evocative, destination-specific title]",
      "theme": "One-line theme referencing a real place or activity",
      "schedule": [
        {
          "time": "09:00",
          "activity": "Specific named activity (no generic verbs)",
          "location": "Exact real place name",
          "duration": "2 hours",
          "estimatedCost": 500,
          "tips": "Insider tip with practical detail",
          "category": "sightseeing|food|transport|accommodation|activity|shopping|nightlife"
        }
      ],
      "meals": {
        "breakfast": { "place": "Real restaurant name", "dish": "Specific dish", "estimatedCost": 200 },
        "lunch":     { "place": "Real restaurant name", "dish": "Specific dish", "estimatedCost": 400 },
        "dinner":    { "place": "Real restaurant name", "dish": "Specific dish", "estimatedCost": 700 }
      },
      "accommodation": { "name": "Real hotel name", "area": "Specific neighbourhood", "estimatedCost": 2000 },
      "dayBudget": 4000,
      "transportForDay": "Specific transport mode and cost"
    }
  ],
  "packing_list": [
    { "name": "Category name", "items": ["item 1", "item 2", "item 3"] }
  ],
  "weather": {
    "temperature": "28–34°C",
    "condition": "Sunny with sea breeze",
    "rainPrediction": "20% chance",
    "suggestion": "Specific packing advice for this destination"
  },
  "budgetBreakdown": {
    "accommodation": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "shopping": 0,
    "miscellaneous": 0,
    "total": 0
  }
}`;

const RECOMMENDATIONS_SYSTEM = `You are WanderGenie, a travel recommendations expert with deep local knowledge.
Return ONLY a valid JSON object. All recommended places MUST be real and exist at the destination.

JSON SCHEMA:
{
  "destination": "string",
  "hotels": [
    { "name": "string", "category": "budget|mid-range|luxury", "area": "string",
      "pricePerNight": 0, "rating": 4.2, "highlights": ["string"], "bookingTip": "string" }
  ],
  "restaurants": [
    { "name": "string", "cuisine": "string", "area": "string", "priceRange": "₹₹",
      "rating": 4.3, "mustTry": ["string"], "bestFor": "string", "timings": "string", "reservationNeeded": false }
  ],
  "attractions": [
    { "name": "string", "category": "beach|heritage|nature|market|religious|viewpoint",
      "area": "string", "entryFee": 0, "duration": "2 hours",
      "rating": 4.5, "bestTime": "morning", "insiderTip": "string" }
  ],
  "activities": [
    { "name": "string", "category": "adventure|cultural|food|nightlife|shopping|wellness",
      "duration": "3 hours", "estimatedCost": 1500,
      "difficulty": "easy|moderate|challenging", "bookingRequired": false, "description": "string" }
  ],
  "localTransport": {
    "options": [
      { "mode": "string", "averageCost": "₹300/day", "tip": "string" }
    ],
    "appRecommendations": ["string"],
    "transportTip": "string"
  },
  "quickFacts": {
    "localLanguage": "string", "currency": "string",
    "timezone": "string", "emergencyNumber": "string", "bestAreas": ["string"]
  }
}`;

const FULL_PLAN_SYSTEM = `You are WanderGenie, an elite AI travel planner with encyclopedic local knowledge.
Return ONLY a valid JSON object — no text outside the JSON.
All place names must be REAL and exist at the destination.

JSON SCHEMA:
{
  "overview": { "destination": "string", "bestTimeToVisit": "string", "quickTips": ["string"] },
  "itinerary": [
    {
      "day": 1, "title": "string", "theme": "string",
      "schedule": [
        { "time": "string", "activity": "string", "location": "string",
          "duration": "string", "estimatedCost": 0, "tips": "string", "category": "string" }
      ],
      "meals": {
        "breakfast": { "place": "string", "dish": "string", "estimatedCost": 0 },
        "lunch":     { "place": "string", "dish": "string", "estimatedCost": 0 },
        "dinner":    { "place": "string", "dish": "string", "estimatedCost": 0 }
      },
      "accommodation": { "name": "string", "area": "string", "estimatedCost": 0 },
      "dayBudget": 0,
      "transportForDay": "string"
    }
  ],
  "recommendations": {
    "hotels":      [{ "name": "string", "category": "string", "area": "string", "pricePerNight": 0, "rating": 4.2, "highlights": ["string"] }],
    "restaurants": [{ "name": "string", "cuisine": "string", "area": "string", "priceRange": "string", "rating": 4.3, "mustTry": ["string"] }],
    "attractions": [{ "name": "string", "category": "string", "entryFee": 0, "duration": "string", "rating": 4.4, "insiderTip": "string" }],
    "activities":  [{ "name": "string", "category": "string", "estimatedCost": 0, "description": "string" }],
    "localTransport": { "options": [{ "mode": "string", "averageCost": "string", "tip": "string" }] }
  },
  "packing_list": [{ "name": "string", "items": ["string"] }],
  "weather": { "temperature": "string", "condition": "string", "rainPrediction": "string", "suggestion": "string" },
  "budgetBreakdown": { "accommodation": 0, "food": 0, "transport": 0, "activities": 0, "shopping": 0, "miscellaneous": 0, "total": 0 }
}`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildItineraryPrompt({ destination, budget, duration, interests, travelStyle }) {
  const bud  = classifyBudget(budget, duration);
  const seed = getDestinationSeed(destination);

  return `Generate a ${duration}-day travel itinerary for ${destination}.
${seed}

TRIP PARAMETERS:
- Total budget: ₹${budget.toLocaleString("en-IN")} (₹${bud.perDay.toLocaleString("en-IN")}/day — ${bud.label})
- Accommodation: ${bud.accom}
- Food: ${bud.food}
- Travel style: ${travelStyle}
- Interests: ${interests.join(", ")}
- Duration: ${duration} days

DAY-BY-DAY RULES:
- Day 1: arrive, check in at a REAL hotel matching the budget, easy orientation, first meal at a NAMED restaurant
- Day ${duration}: final highlights, check-out, departure logistics
- Middle days: 3–4 schedule items each; cluster activities by geography
- Every meal must name a REAL restaurant from the destination
- Every activity must name a REAL place or operator
- If interests include "beaches" → include named beaches (Baga, Anjuna etc. for Goa)
- If interests include "nightlife" → include real clubs/bars by name
- If interests include "adventure" → include real operators/prices
- Budget breakdown must total ≤ ₹${budget}

Return JSON only. No text outside the JSON object.`;
}

function buildRecommendationsPrompt({ destination, budget, duration, interests, travelStyle }) {
  const bud  = classifyBudget(budget, duration);
  const seed = getDestinationSeed(destination);

  return `Generate travel recommendations for ${destination}.
${seed}

TRAVELLER PROFILE:
- Budget: ₹${budget.toLocaleString("en-IN")} (${bud.label}, ₹${bud.perDay}/day)
- Travel style: ${travelStyle}
- Interests: ${interests.join(", ")}

REQUIREMENTS:
- 3 hotels across tiers (budget/mid/luxury); mark which matches ₹${bud.perDay}/day budget
- 5–6 real restaurants across cuisine types and price ranges
- 6–8 real attractions with accurate entry fees
- 4–5 activities matching interests: ${interests.join(", ")}
- All transport modes available in ${destination}
- All names must be REAL, verifiable places — do not invent

Return JSON only.`;
}

function buildFullPlanPrompt({ destination, budget, duration, interests, travelStyle }) {
  const bud  = classifyBudget(budget, duration);
  const seed = getDestinationSeed(destination);

  return `Create a complete ${duration}-day trip plan for ${destination}.
${seed}

TRIP PARAMETERS:
- Total budget: ₹${budget.toLocaleString("en-IN")} (₹${bud.perDay}/day — ${bud.label})
- Accommodation: ${bud.accom} | Food: ${bud.food}
- Travel style: ${travelStyle}
- Interests: ${interests.join(", ")}

REQUIREMENTS:
1. ${duration} fully detailed days — Day 1 arrival, Day ${duration} departure
2. Real restaurant names for every meal
3. Real hotels matching the budget
4. 3 hotel options (one per tier), 5 restaurants, 6 attractions, 4 activities in recommendations
5. Budget breakdown total ≤ ₹${budget}
6. Activities must match interests: ${interests.join(", ")}

Return JSON only.`;
}

// ─── Response normaliser ──────────────────────────────────────────────────────
/**
 * Converts Groq's rich schedule[] output into the flat activities[]
 * array the frontend and Trip model expect, while preserving the
 * structured schedule for richer UIs.
 */
function normaliseItineraryDays(itinerary = [], destination, duration) {
  const days = itinerary.map(d => ({
    day:   d.day,
    title: d.title || `Day ${d.day} — Explore ${destination}`,
    theme: d.theme || null,
    // Flat string activities (backward-compatible with frontend)
    activities: Array.isArray(d.schedule) && d.schedule.length
      ? d.schedule.map(s =>
          [
            s.time     && `${s.time}`,
            s.activity,
            s.location && `@ ${s.location}`,
            s.tips     && `💡 ${s.tips}`,
          ].filter(Boolean).join(" — ")
        )
      : (d.activities || [`Explore ${destination}`]),
    // Rich structured data
    schedule:        d.schedule        || [],
    meals:           d.meals           || null,
    accommodation:   d.accommodation   || null,
    dayBudget:       d.dayBudget       || null,
    transportForDay: d.transportForDay || null,
  }));

  // Guarantee frontend always receives `duration` days even if model was concise
  for (let n = days.length + 1; n <= duration; n++) {
    days.push({
      day: n, title: `Day ${n} — Explore ${destination}`,
      activities: [`Continue exploring ${destination}`], schedule: [],
    });
  }
  return days;
}

function normalisePacking(raw, { interests = [], destination } = {}) {
  if (Array.isArray(raw) && raw.length > 0 && raw[0]?.name) return raw;
  const isBeach    = interests.includes("beaches");
  const isMountain = interests.includes("mountains") || interests.includes("adventure");
  return [
    { name: "Clothing",   items: ["Light breathable tops (3–4)", "Comfortable walking shoes", ...(isBeach ? ["Swimwear (2 sets)", "Flip-flops", "Beach sarong"] : []), ...(isMountain ? ["Thermal layers", "Waterproof jacket", "Trekking boots"] : [])] },
    { name: "Essentials", items: ["Passport/ID + photocopies", "Travel insurance docs", "Power bank (20,000 mAh)", "Local cash + cards", "Basic first-aid kit"] },
    { name: "Tech",       items: ["Phone + charger", "Universal adapter", "Sunglasses (UV400)"] },
    { name: "Health",     items: ["Sunscreen SPF 50", "Insect repellent", "Hand sanitiser", "Compact umbrella"] },
  ];
}

// ─── 1. ITINERARY GENERATION ─────────────────────────────────────────────────
async function generateItinerary(params) {
  const { destination, budget, duration, travelStyle = "balanced" } = params;
  const start = Date.now();

  try {
    const raw    = await callGroq({ system: ITINERARY_SYSTEM, user: buildItineraryPrompt(params) });
    const parsed = extractJSON(raw);

    return {
      overview:        parsed.overview        || { destination, duration, totalBudget: budget },
      itinerary:       normaliseItineraryDays(parsed.itinerary, destination, duration),
      packing_list:    normalisePacking(parsed.packing_list || parsed.packingList, params),
      weather:         parsed.weather         || { temperature: "Check locally", condition: "Varies", rainPrediction: "30%", suggestion: "Pack layers and a compact umbrella." },
      budgetBreakdown: parsed.budgetBreakdown || null,
      generationDurationMs: Date.now() - start,
      aiProvider: "groq",
      model:      GROQ_MODEL,
    };
  } catch (err) {
    console.error("[Groq] generateItinerary failed:", err.message);
    const fallback = buildFallbackItinerary(params);
    return { ...fallback, generationDurationMs: Date.now() - start, aiProvider: "fallback" };
  }
}

// ─── 2. RECOMMENDATIONS ENGINE ───────────────────────────────────────────────
async function generateRecommendations(params) {
  const { destination } = params;
  const start = Date.now();

  try {
    const raw    = await callGroq({ system: RECOMMENDATIONS_SYSTEM, user: buildRecommendationsPrompt(params), maxTok: 4000 });
    const parsed = extractJSON(raw);
    return { ...parsed, generationDurationMs: Date.now() - start, aiProvider: "groq", model: GROQ_MODEL };
  } catch (err) {
    console.error("[Groq] generateRecommendations failed:", err.message);
    return {
      destination, hotels: [], restaurants: [], attractions: [], activities: [],
      localTransport: { options: [], appRecommendations: ["Ola", "Uber", "Google Maps"], transportTip: "Always agree on fare before boarding." },
      generationDurationMs: Date.now() - start, aiProvider: "fallback",
      note: "Recommendations temporarily unavailable — please try again shortly.",
    };
  }
}

// ─── 3. FULL TRIP PLAN ────────────────────────────────────────────────────────
async function generateFullPlan(params) {
  const { destination, budget, duration } = params;
  const start = Date.now();

  try {
    const raw    = await callGroq({ system: FULL_PLAN_SYSTEM, user: buildFullPlanPrompt(params) });
    const parsed = extractJSON(raw);

    // Normalise itinerary days in the full plan too
    if (Array.isArray(parsed.itinerary)) {
      parsed.itinerary = normaliseItineraryDays(parsed.itinerary, destination, duration);
    }
    if (!Array.isArray(parsed.packing_list) || !parsed.packing_list.length) {
      parsed.packing_list = normalisePacking(null, params);
    }

    return { ...parsed, generationDurationMs: Date.now() - start, aiProvider: "groq", model: GROQ_MODEL };
  } catch (err) {
    console.error("[Groq] generateFullPlan failed:", err.message);
    const fallback = buildFallbackItinerary(params);
    return { ...fallback, recommendations: null, generationDurationMs: Date.now() - start, aiProvider: "fallback" };
  }
}

// ─── 4. DESTINATION INSIGHTS ─────────────────────────────────────────────────
async function generateDestinationInsights(destination) {
  const seed  = getDestinationSeed(destination);
  const start = Date.now();

  const system = `You are a travel expert. Return ONLY valid JSON — no text outside it.
Schema: {
  "destination":"string","overview":"2–3 vivid sentences","topReasons":["x5"],
  "bestMonths":["string"],"avoidMonths":["string"],
  "averageDailyBudget":{"budget":0,"midRange":0,"luxury":0},
  "visaInfo":"string","safetyRating":4.2,"popularWith":["string"],
  "hiddenGems":["x3"],"localPhrases":[{"phrase":"string","meaning":"string"}]
}`;

  const user = `Travel insights for ${destination}.${seed ? "\n" + seed : ""}\nReturn JSON only.`;

  try {
    const raw    = await callGroq({ system, user, maxTok: 1500 });
    const parsed = extractJSON(raw);
    return { ...parsed, generationDurationMs: Date.now() - start };
  } catch (err) {
    console.error("[Groq] generateDestinationInsights failed:", err.message);
    return { destination, error: "Insights temporarily unavailable", generationDurationMs: Date.now() - start };
  }
}

module.exports = {
  generateItinerary,
  generateRecommendations,
  generateFullPlan,
  generateDestinationInsights,
  classifyBudget,
  getDestinationSeed,  // exported for testing
};
