const express = require("express");
const router = express.Router();
const {
  generate, getMyTrips, getTrip,
  saveTrip, deleteTrip, getSavedTrips,
} = require("../controllers/tripController");
const { protect, optionalAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { generateTripValidator } = require("../validators/tripValidators");

// Generate — open to guests (optionalAuth attaches user if token present)
router.post("/generate", optionalAuth, validate(generateTripValidator), generate);

// Authenticated routes
router.get("/", protect, getMyTrips);
router.get("/saved", protect, getSavedTrips);
router.get("/:id", optionalAuth, getTrip);
router.patch("/:id/save", protect, saveTrip);
router.delete("/:id", protect, deleteTrip);

module.exports = router;
