// lib/api.js
// API integration layer — WanderGenie backend (Groq AI)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Generate itinerary + packing list from travel preferences
 * POST /api/generate-itinerary
 */
export async function generateItinerary({ destination, budget, duration, interests, travelMonth, travelStyle }) {
  const response = await fetch(`${BASE_URL}/api/generate-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination,
      budget:      Number(budget),
      duration:    Number(duration),
      interests,
      travelStyle: travelStyle || 'balanced',
      travelMonth: travelMonth || null,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Request failed with status ${response.status}`)
  }

  const json = await response.json()

  // Unwrap: { success, data: { trip: { ... } } }
  const trip = json?.data?.trip || json?.data || json

  return {
    destination,
    duration,
    budget,
    travelMonth,
    travelStyle,
    itinerary:       Array.isArray(trip.itinerary) ? trip.itinerary : [],
    packing_list:    normalisePacking(trip.packing_list),
    weather:         normaliseWeather(trip.weather, destination),
    overview:        trip.overview        || null,
    budgetBreakdown: trip.budgetBreakdown  || null,
  }
}

// ─── Packing list normaliser ──────────────────────────────────────────────────
// Backend: [{ name: "Clothing", items: ["item1"] }]
// Frontend: { clothing: [{ item: "item1", checked: false }] }

function normalisePacking(packingList) {
  if (packingList && !Array.isArray(packingList) && typeof packingList === 'object') {
    return packingList
  }
  if (Array.isArray(packingList) && packingList.length > 0) {
    const result = {}
    packingList.forEach(({ name = 'general', items = [] }) => {
      const key = name.toLowerCase().replace(/[^a-z]/g, '') || 'general'
      result[key] = items.map(item => ({
        item:    typeof item === 'string' ? item : (item.item || String(item)),
        checked: false,
      }))
    })
    if (Object.keys(result).length > 0) return result
  }
  return getDefaultPacking()
}

// ─── Weather normaliser ───────────────────────────────────────────────────────
// Backend: { temperature: "28–34°C", condition: "Sunny", rainPrediction: "20%", suggestion: "..." }
// Frontend: { temp_high, temp_low, condition, humidity, rain_chance, icon, suggestion }

function normaliseWeather(weather, destination) {
  if (!weather) return getDefaultWeather(destination)

  const tempStr   = weather.temperature || ''
  const tempMatch = tempStr.match(/(\d+)[^\d]+(\d+)/)
  const temp_low  = tempMatch ? parseInt(tempMatch[1]) : 24
  const temp_high = tempMatch ? parseInt(tempMatch[2]) : 32

  const rainStr     = weather.rainPrediction || weather.rain_chance || '25%'
  const rainMatch   = rainStr.toString().match(/(\d+)/)
  const rain_chance = rainMatch ? parseInt(rainMatch[1]) : 25

  const humStr   = weather.humidity || '65%'
  const humMatch = humStr.toString().match(/(\d+)/)
  const humidity = humMatch ? parseInt(humMatch[1]) : 65

  return {
    temp_high,
    temp_low,
    condition:  weather.condition  || 'Pleasant weather',
    humidity,
    rain_chance,
    suggestion: weather.suggestion || '',
    icon:       getWeatherIcon(weather.condition || ''),
  }
}

function getWeatherIcon(condition) {
  const c = condition.toLowerCase()
  if (c.includes('rain') || c.includes('shower')) return 'cloudy-rain'
  if (c.includes('cloud'))                         return 'cloudy'
  if (c.includes('hot') || c.includes('desert'))  return 'hot'
  if (c.includes('snow') || c.includes('cold'))   return 'rain'
  return 'sunny'
}

function getDefaultWeather(destination) {
  const profiles = {
    goa:       { temp_high: 32, temp_low: 26, condition: 'Sunny with coastal breeze',      humidity: 78, rain_chance: 15, icon: 'sunny'      },
    bali:      { temp_high: 30, temp_low: 24, condition: 'Partly cloudy, tropical showers', humidity: 85, rain_chance: 60, icon: 'cloudy-rain' },
    manali:    { temp_high: 15, temp_low: 5,  condition: 'Cool and crisp mountain air',      humidity: 60, rain_chance: 25, icon: 'cloudy'      },
    kerala:    { temp_high: 31, temp_low: 24, condition: 'Humid with lush greenery',         humidity: 82, rain_chance: 55, icon: 'cloudy-rain' },
    rajasthan: { temp_high: 36, temp_low: 22, condition: 'Hot and dry desert air',           humidity: 30, rain_chance: 10, icon: 'hot'        },
    delhi:     { temp_high: 35, temp_low: 22, condition: 'Sunny and dry',                    humidity: 45, rain_chance: 10, icon: 'sunny'      },
    mumbai:    { temp_high: 33, temp_low: 26, condition: 'Humid coastal weather',            humidity: 80, rain_chance: 20, icon: 'cloudy'     },
    paris:     { temp_high: 18, temp_low: 11, condition: 'Mild and partly cloudy',           humidity: 65, rain_chance: 30, icon: 'cloudy'     },
    tokyo:     { temp_high: 22, temp_low: 15, condition: 'Clear skies, pleasant',            humidity: 55, rain_chance: 20, icon: 'sunny'      },
    dubai:     { temp_high: 38, temp_low: 28, condition: 'Hot and sunny, very dry',          humidity: 40, rain_chance: 5,  icon: 'hot'        },
  }
  const key = destination?.toLowerCase().trim().replace(/[^a-z]/g, '')
  return profiles[key] || { temp_high: 28, temp_low: 20, condition: 'Mostly pleasant', humidity: 65, rain_chance: 25, icon: 'cloudy' }
}

function getDefaultPacking() {
  return {
    clothing: [
      { item: 'Light breathable tops (3–4)',        checked: false },
      { item: 'Comfortable walking pants / shorts', checked: false },
      { item: 'One smart-casual outfit for dinners',checked: false },
      { item: 'Comfortable walking shoes',          checked: false },
      { item: 'Swimwear (2 sets)',                  checked: false },
      { item: 'Flip-flops / beach sandals',         checked: false },
    ],
    essentials: [
      { item: 'Passport / ID + photocopies',        checked: false },
      { item: 'Travel insurance documents',         checked: false },
      { item: 'Power bank (20,000 mAh)',            checked: false },
      { item: 'Universal travel adapter',           checked: false },
      { item: 'Reusable water bottle',              checked: false },
      { item: 'Basic first-aid kit',                checked: false },
    ],
    accessories: [
      { item: 'Sunglasses (UV400)',                 checked: false },
      { item: 'Compact travel umbrella',            checked: false },
      { item: 'Day backpack (20L)',                 checked: false },
    ],
    health: [
      { item: 'SPF 50 sunscreen',                   checked: false },
      { item: 'Insect repellent',                   checked: false },
      { item: 'Hand sanitiser',                     checked: false },
      { item: 'Prescription medications',           checked: false },
    ],
  }
}