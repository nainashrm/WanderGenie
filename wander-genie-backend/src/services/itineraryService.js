/**
 * WanderGenie — Itinerary Service  (v3)
 *
 * Thin pass-through to groqService.
 * All AI logic lives in groqService.js; fallback in fallbackService.js.
 * Kept for backward-compatibility with any code that imports from here.
 */

"use strict";

const {
  generateItinerary,
  generateRecommendations,
} = require("./groqService");

module.exports = { generateItinerary, generateRecommendations };
