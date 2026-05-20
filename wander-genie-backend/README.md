# WanderGenie Backend — v3 (Destination-Specific AI Fix)

Node.js + Express + MongoDB + Groq AI  
Generates personalised, destination-specific travel itineraries using LLaMA 3.3 70B.

---

## What Was Wrong (v2 → v3 Fix)

The itinerary output was generic ("Morning stroll through the old quarter", "Visit the central market") because of **six compounding bugs**:

| # | Root Cause | Symptom | Fix |
|---|-----------|---------|-----|
| 1 | `response_format: { type: "json_object" }` **missing** from every Groq call | Groq returned prose/markdown → `JSON.parse` failed → silent fallback to hardcoded template | Added to `callGroq()` |
| 2 | `GROQ_MAX_TOKENS = 4096` — too low | Multi-day itinerary JSON was **truncated mid-object** → `JSON.parse` failed → silent fallback | Raised to **8000** |
| 3 | No destination context in prompts | Model had nothing anchoring it to real places → produced city-agnostic filler | `DESTINATION_SEEDS` injects real beaches, restaurants, streets into every prompt |
| 4 | `extractJSON` had no truncation repair | Half-written JSON threw → triggered fallback silently | Multi-pass repair: strip fences → isolate `{}` → remove trailing commas → close open brackets |
| 5 | Prompts were schema-heavy | Most of the token budget went to field definitions, not destination knowledge | Simplified schema, shorter system prompt, richer user prompt |
| 6 | `fallbackService.js` used generic `INTEREST_POOL` | Even the fallback said "morning walk" for Goa instead of "Baga Beach parasailing" | Rebuilt with per-destination activity pools and real place names for 10 destinations |

---

## Quick Start

```bash
cd wander-genie-backend
cp .env.example .env
# Fill in GROQ_API_KEY and MONGODB_URI
npm install
npm run dev
```

**Get a free Groq API key:** https://console.groq.com (no credit card required)

---

## Environment Variables

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx   # Required
GROQ_MODEL=llama-3.3-70b-versatile      # Recommended
GROQ_MAX_TOKENS=8000                    # Do NOT go below 5000
GROQ_TEMPERATURE=0.65                   # 0.6–0.7 for consistent JSON
```

---

## API Endpoints

### Generate Itinerary
```
POST /api/trips/generate
POST /api/generate-itinerary   ← legacy endpoint, same handler

Body:
{
  "destination": "Goa",
  "budget": 25000,
  "duration": 4,
  "interests": ["beaches", "nightlife", "food"],
  "travelStyle": "budget"
}
```

### Full Plan (Itinerary + Recommendations in one call)
```
POST /api/trips/full-plan
Body: same as above
```

### Recommendations Only
```
POST /api/trips/recommendations
Body: { "destination", "budget", "duration", "interests", "travelStyle" }
```

### Destination Insights
```
GET /api/trips/destination/Goa/insights
```

### Health Check
```
GET /health
→ { success: true, ai: { provider: "groq", model: "...", keySet: true } }
```

---

## Sample Response — Goa, 3 days, ₹18,000, beaches + nightlife

```json
{
  "success": true,
  "data": {
    "trip": {
      "destination": "Goa",
      "itinerary": [
        {
          "day": 1,
          "title": "Day 1 — Arrival & Baga Beach First Dip",
          "theme": "Check in, first beach sunset, Goan welcome dinner",
          "activities": [
            "14:00 — Check in at Casa de Goa @ Calangute 💡 Request a pool-view room",
            "16:00 — First swim at Calangute Beach @ Calangute Beach 💡 Hire a sun lounger ₹150",
            "18:30 — Sunset drinks @ Curlies beach shack, Anjuna 💡 Try the frozen feni margarita",
            "20:30 — Welcome dinner @ Britto's, Baga Beach 💡 Order the Goan fish curry rice"
          ],
          "meals": {
            "breakfast": { "place": "In transit", "dish": "Airport meal", "estimatedCost": 400 },
            "lunch": { "place": "In transit", "dish": "Roadside dabha", "estimatedCost": 150 },
            "dinner": { "place": "Britto's, Baga Beach", "dish": "Goan fish curry rice + sol kadhi", "estimatedCost": 700 }
          },
          "accommodation": { "name": "Casa de Goa", "area": "Calangute", "estimatedCost": 2500 },
          "dayBudget": 4800,
          "transportForDay": "Ola from airport to hotel (₹600)"
        },
        {
          "day": 2,
          "title": "Day 2 — Water Sports, Anjuna Market & Tito's Lane",
          "activities": [
            "08:30 — Parasailing @ Baga Beach 💡 Book at the parasailing kiosk ₹700",
            "10:30 — Jet-ski session @ Calangute Water Sports 💡 ₹600 for 15 minutes, bargain to ₹500",
            "13:00 — Lunch @ Vinayak Family Restaurant 💡 Seafood thali ₹250, arrive before 1:30 PM",
            "15:30 — Anjuna Flea Market browsing 💡 Only on Wednesdays — verify the day",
            "22:00 — Tito's Lane bar-hop, Baga 💡 No cover charge before 11 PM at most bars"
          ]
        }
      ],
      "weather": {
        "temperature": "28–34°C",
        "condition": "Sunny with sea breeze",
        "rainPrediction": "20% chance (avoid Jun–Sep monsoon)",
        "suggestion": "Pack SPF 50, light cotton, and beach sandals."
      }
    }
  }
}
```

---

## Destinations With Deep Local Knowledge

Built-in `DESTINATION_SEEDS` in `groqService.js` + `DESTINATIONS` in `fallbackService.js`:

| Destination | Seed covers |
|-------------|------------|
| **Goa** | Baga, Anjuna, Calangute, Vagator, Tito's Lane, water sports, beach clubs, spice farms |
| **Manali** | Rohtang Pass, Solang Valley, Old Manali cafes, Beas River rafting, Hadimba |
| **Kerala** | Alleppey houseboats, Fort Kochi, Munnar, Periyar, Kathakali, Varkala |
| **Rajasthan** | Amber Fort, Mehrangarh, Thar safari, Udaipur lakes, Pushkar |
| **Delhi** | Chandni Chowk, Red Fort, Qutub Minar, Hauz Khas, Connaught Place |
| **Mumbai** | Gateway, Elephanta, Dharavi, Marine Drive, Colaba, Bandra |
| **Bali** | Tegallalang, Uluwatu, Canggu surf, Ubud, Nusa Penida |
| **Paris** | Louvre, Montmartre, Marais, Canal Saint-Martin, Versailles |
| **Tokyo** | Asakusa, Shibuya Crossing, teamLab, Tsukiji, Akihabara |
| **Dubai** | Burj Khalifa, desert safari, Deira souks, Al Fahidi, DIFC dining |

Any other destination uses Groq's general training knowledge — still destination-specific, just without the extra curated context hints.

---

## Travel Styles
`budget` | `mid-range` | `luxury` | `adventure` | `family` | `solo` | `couple` | `group` | `balanced`

## Valid Interests
`beaches` | `cafes` | `nightlife` | `adventure` | `mountains` | `culture` | `shopping` | `food` | `history` | `nature` | `wellness`
