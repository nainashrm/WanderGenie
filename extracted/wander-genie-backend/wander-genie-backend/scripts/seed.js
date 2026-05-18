/**
 * WanderGenie — Database Seed Script
 *
 * Creates sample users and trips for development / demo purposes.
 * Run: node scripts/seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Trip = require("../src/models/Trip");

const SAMPLE_USERS = [
  { name: "Aarav Mehta", email: "aarav@example.com", password: "password123" },
  { name: "Priya Sharma", email: "priya@example.com", password: "password123" },
];

const SAMPLE_TRIPS = [
  {
    destination: "Goa",
    budget: 25000,
    duration: 5,
    interests: ["beaches", "nightlife", "cafes"],
    itinerary: [
      { day: 1, title: "Day 1 — Arrival & First Impressions", activities: ["Check in at a beachside guesthouse", "Sunset stroll on Baga Beach", "Dinner at a seafood shack"] },
      { day: 2, title: "Day 2 — Adventure & Discovery", activities: ["Morning water sports at Calangute", "Explore Anjuna flea market", "Evening cocktails at a cliff-top bar"] },
      { day: 3, title: "Day 3 — Culture & Flavours", activities: ["Visit Old Goa churches and heritage trail", "Local fish curry thali lunch", "Night out at Tito's Lane"] },
      { day: 4, title: "Day 4 — Hidden Gems", activities: ["Day trip to Dudhsagar Falls", "Café-hopping in Fontainhas", "Beach bonfire and live music"] },
      { day: 5, title: "Day 5 — Highlights & Farewell", activities: ["Final swim at Palolem Beach", "Last bebinca dessert at a popular bakery", "Head to airport"] },
    ],
    packing_list: [
      { name: "Clothing", items: ["Swimwear (2 sets)", "Beach cover-up", "Light breathable tops", "Flip-flops"] },
      { name: "Essentials", items: ["Passport", "Power bank", "Sunscreen SPF 50+", "First-aid kit"] },
      { name: "Accessories", items: ["Sunglasses", "Day backpack", "Travel adapter"] },
      { name: "Weather & Hygiene", items: ["After-sun lotion", "Insect repellent", "Wet wipes"] },
    ],
    weather: { temperature: "30°C", condition: "Sunny", rainPrediction: "20% chance of rain", suggestion: "Pack sunscreen and light beach wear — it's gorgeous out there." },
    isSaved: true,
  },
  {
    destination: "Manali",
    budget: 18000,
    duration: 4,
    interests: ["mountains", "adventure", "cafes"],
    itinerary: [
      { day: 1, title: "Day 1 — Arrival & First Impressions", activities: ["Check in at a mountain guesthouse", "Orientation walk through Old Manali", "Dinner at a cozy café"] },
      { day: 2, title: "Day 2 — Adventure & Discovery", activities: ["Sunrise trek to a viewpoint", "Rohtang Pass day trip", "Evening hot chocolate by the fireplace"] },
      { day: 3, title: "Day 3 — Culture & Flavours", activities: ["Visit Hadimba Devi Temple", "Try Himachali dham thali", "Solang Valley zip-lining"] },
      { day: 4, title: "Day 4 — Highlights & Farewell", activities: ["Last mountain hike", "Souvenirs from local shops", "Head to bus stand"] },
    ],
    packing_list: [
      { name: "Clothing", items: ["Thermal inner layers", "Fleece jacket", "Waterproof trekking pants", "Trekking shoes"] },
      { name: "Essentials", items: ["ID card", "Power bank", "Basic first-aid kit", "Prescription medications"] },
      { name: "Accessories", items: ["Sunglasses", "Day backpack", "Hand warmers"] },
      { name: "Weather & Hygiene", items: ["Lip balm SPF", "Compact umbrella", "Insect repellent"] },
    ],
    weather: { temperature: "12°C", condition: "Cool and crisp", rainPrediction: "25% chance of rain or snow", suggestion: "Warm layers, waterproof boots, and a windproof jacket are a must." },
    isSaved: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅  Connected to MongoDB");

    // Clear existing seed data
    await User.deleteMany({ email: { $in: SAMPLE_USERS.map((u) => u.email) } });
    await Trip.deleteMany({ destination: { $in: ["Goa", "Manali"] } });

    // Create users
    const users = await User.create(SAMPLE_USERS);
    console.log(`👤  Created ${users.length} sample users`);

    // Create trips for first user
    const trips = await Trip.create(
      SAMPLE_TRIPS.map((t) => ({ ...t, user: users[0]._id }))
    );
    console.log(`🗺️   Created ${trips.length} sample trips`);

    // Link trips to user
    await User.findByIdAndUpdate(users[0]._id, {
      savedTrips: trips.filter((t) => t.isSaved).map((t) => t._id),
    });

    console.log("\n✅  Seed complete!");
    console.log("   Demo credentials:");
    console.log("   Email    : aarav@example.com");
    console.log("   Password : password123\n");
  } catch (err) {
    console.error("❌  Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
