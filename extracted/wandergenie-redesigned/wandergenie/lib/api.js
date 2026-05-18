// lib/api.js
// API integration layer — replace BASE_URL with your FastAPI backend URL

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Generate itinerary + packing list from travel preferences
 * POST /generate-itinerary
 */
export async function generateItinerary({ destination, budget, duration, interests }) {
  const response = await fetch(`${BASE_URL}/generate-itinerary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destination, budget, duration, interests }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Mock API — returns realistic placeholder data
 * Used when backend is not yet connected
 */
export async function mockGenerateItinerary({ destination, budget, duration, interests }) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2800))

  const days = Array.from({ length: parseInt(duration) || 3 }, (_, i) => ({
    day: i + 1,
    title: getDayTitle(destination, i),
    activities: getDayActivities(destination, interests, i),
    meals: getDayMeals(destination, i),
    tips: getTip(destination, i),
  }))

  return {
    destination,
    duration,
    budget,
    itinerary: days,
    packing_list: getPackingList(interests),
    weather: getWeatherData(destination),
  }
}

function getDayTitle(destination, i) {
  const titles = [
    `Arrival & First Impressions`,
    `Deep Dive into Culture`,
    `Adventure & Exploration`,
    `Hidden Gems & Local Life`,
    `Relaxation & Farewell`,
    `Off the Beaten Path`,
    `Coastal & Nature Day`,
  ]
  return titles[i % titles.length]
}

function getDayActivities(destination, interests = [], index) {
  const base = [
    [`Morning stroll through the old quarter`, `Visit the central market`, `Sunset at the waterfront`],
    [`Guided heritage walk`, `Local cooking class experience`, `Evening rooftop dinner`],
    [`Day trip to nearby nature reserve`, `Kayaking or hiking trail`, `Stargazing at viewpoint`],
    [`Explore artisan workshops`, `Street food tour with locals`, `Jazz bar or live music night`],
    [`Spa morning & slow breakfast`, `Souvenir shopping at local boutiques`, `Farewell sunset cruise`],
    [`Sunrise yoga session`, `Temple or monastery visit`, `Farm-to-table dinner`],
    [`Beach walk at dawn`, `Snorkeling or water sports`, `Beachside bonfire dinner`],
  ]
  return base[index % base.length]
}

function getDayMeals(destination, index) {
  const meals = [
    { breakfast: 'Hotel breakfast or local café', lunch: 'Street food market', dinner: 'Waterfront restaurant' },
    { breakfast: 'Fresh fruit smoothie bowl', lunch: 'Traditional local cuisine', dinner: 'Rooftop bistro' },
    { breakfast: 'Bakery croissant & coffee', lunch: 'Trailhead picnic', dinner: 'Farm-to-table experience' },
    { breakfast: 'Hole-in-the-wall noodles', lunch: 'Night market preview', dinner: 'Fine dining' },
    { breakfast: 'Brunch at artisan café', lunch: 'Beachside snacks', dinner: 'Farewell feast' },
  ]
  return meals[index % meals.length]
}

function getTip(destination, index) {
  const tips = [
    'Book popular restaurants 2 days ahead.',
    "Carry cash — some local vendors don't accept cards.",
    'Start early to beat the midday heat.',
    'Download an offline map before heading out.',
    'Ask your hotel for a local SIM card tip.',
  ]
  return tips[index % tips.length]
}

function getPackingList(interests = []) {
  const base = {
    clothing: [
      { item: 'Lightweight breathable shirts (5–6)', checked: false },
      { item: 'Comfortable walking shorts/pants', checked: false },
      { item: 'One smart-casual outfit for dinners', checked: false },
      { item: 'Compact travel jacket or cardigan', checked: false },
      { item: 'Comfortable walking shoes', checked: false },
    ],
    essentials: [
      { item: 'Universal travel adapter', checked: false },
      { item: 'Portable power bank (20,000 mAh)', checked: false },
      { item: 'Travel insurance documents', checked: false },
      { item: 'Copies of passport & ID', checked: false },
      { item: 'Reusable water bottle', checked: false },
      { item: 'Noise-cancelling earbuds', checked: false },
    ],
    accessories: [
      { item: 'Polarized sunglasses', checked: false },
      { item: 'Compact travel umbrella', checked: false },
      { item: 'Day backpack (20–25L)', checked: false },
      { item: 'Travel neck pillow', checked: false },
    ],
    health: [
      { item: 'SPF 50 sunscreen', checked: false },
      { item: 'Insect repellent (DEET-based)', checked: false },
      { item: 'Basic first-aid kit', checked: false },
      { item: 'Hand sanitizer & face masks', checked: false },
      { item: 'Prescription medications (2x supply)', checked: false },
    ],
  }

  // Add interest-based items
  if (interests.includes('beaches') || interests.includes('adventure')) {
    base.clothing.push({ item: 'Swimwear (2 sets)', checked: false })
    base.clothing.push({ item: 'Water-resistant sandals', checked: false })
    base.accessories.push({ item: 'Waterproof phone pouch', checked: false })
    base.health.push({ item: 'Reef-safe sunscreen', checked: false })
  }
  if (interests.includes('mountains') || interests.includes('adventure')) {
    base.clothing.push({ item: 'Moisture-wicking trekking socks', checked: false })
    base.clothing.push({ item: 'Sturdy hiking boots', checked: false })
    base.accessories.push({ item: 'Trekking poles (collapsible)', checked: false })
    base.essentials.push({ item: 'Headlamp with extra batteries', checked: false })
  }
  if (interests.includes('culture')) {
    base.clothing.push({ item: 'Modest cover-up for temples/churches', checked: false })
  }
  if (interests.includes('nightlife')) {
    base.clothing.push({ item: 'One formal/party outfit', checked: false })
    base.accessories.push({ item: 'Compact clutch or crossbody bag', checked: false })
  }
  if (interests.includes('cafes') || interests.includes('shopping')) {
    base.accessories.push({ item: 'Foldable tote bag for shopping', checked: false })
  }

  return base
}

function getWeatherData(destination) {
  const weatherProfiles = {
    goa: { temp_high: 32, temp_low: 26, condition: 'Sunny with coastal breeze', humidity: 78, rain_chance: 15, icon: 'sunny' },
    bali: { temp_high: 30, temp_low: 24, condition: 'Partly cloudy, tropical showers', humidity: 85, rain_chance: 60, icon: 'cloudy-rain' },
    paris: { temp_high: 18, temp_low: 11, condition: 'Mild and partly cloudy', humidity: 65, rain_chance: 30, icon: 'cloudy' },
    tokyo: { temp_high: 22, temp_low: 15, condition: 'Clear skies, pleasant', humidity: 55, rain_chance: 20, icon: 'sunny' },
    maldives: { temp_high: 31, temp_low: 27, condition: 'Sunny with light sea breeze', humidity: 80, rain_chance: 10, icon: 'sunny' },
    iceland: { temp_high: 8, temp_low: 2, condition: 'Cold, possible light rain', humidity: 70, rain_chance: 45, icon: 'rain' },
    dubai: { temp_high: 38, temp_low: 28, condition: 'Hot and sunny, very dry', humidity: 40, rain_chance: 5, icon: 'hot' },
  }

  const key = destination?.toLowerCase().trim()
  return weatherProfiles[key] || {
    temp_high: 28,
    temp_low: 20,
    condition: 'Mostly pleasant with light clouds',
    humidity: 65,
    rain_chance: 25,
    icon: 'cloudy',
  }
}
