const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const { generate } = require("../controllers/tripController");
const validate = require("../middleware/validate");
const { generateTripValidator } = require("../validators/tripValidators");

// Mount sub-routers
router.use("/auth", require("./authRoutes"));
router.use("/trips", require("./tripRoutes"));

// Legacy frontend endpoint (matches NEXT_PUBLIC_API_URL + /generate-itinerary)
router.post(
  "/generate-itinerary",
  optionalAuth,
  validate(generateTripValidator),
  generate
);

module.exports = router;
