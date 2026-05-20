const express = require("express");
const router = express.Router();
const {
  generate, getRecommendations, getFullPlan, getDestinationInsights,
  getMyTrips, getSavedTrips, getTrip, saveTrip, deleteTrip,
} = require("../controllers/tripController");
const { protect, optionalAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { generateTripValidator, recommendationsValidator } = require("../validators/tripValidators");

// AI generation — open to guests (token optional)
router.post("/generate",         optionalAuth, validate(generateTripValidator),   generate);
router.post("/full-plan",        optionalAuth, validate(generateTripValidator),   getFullPlan);
router.post("/recommendations",  optionalAuth, validate(recommendationsValidator), getRecommendations);

// Destination insights — no auth required
router.get("/destination/:name/insights", getDestinationInsights);

// Authenticated trip management
router.get("/",        protect, getMyTrips);
router.get("/saved",   protect, getSavedTrips);
router.get("/:id",     optionalAuth, getTrip);
router.patch("/:id/save",  protect, saveTrip);
router.delete("/:id",      protect, deleteTrip);

module.exports = router;
