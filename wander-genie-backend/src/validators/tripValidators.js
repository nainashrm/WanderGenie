const { body } = require("express-validator");

const VALID_INTERESTS = [
  "beaches","cafes","nightlife","adventure","mountains","culture",
  "shopping","food","history","nature","wellness",
];

const VALID_TRAVEL_STYLES = [
  "budget","mid-range","luxury","adventure","family","solo","couple","group","balanced",
];

const VALID_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const generateTripValidator = [
  body("destination")
    .trim().notEmpty().withMessage("Destination is required")
    .isLength({ max: 120 }).withMessage("Destination too long"),
  body("budget")
    .notEmpty().withMessage("Budget is required")
    .isFloat({ min: 1 }).withMessage("Budget must be a positive number"),
  body("duration")
    .notEmpty().withMessage("Duration is required")
    .isInt({ min: 1, max: 30 }).withMessage("Duration must be between 1 and 30 days"),
  body("interests")
    .isArray({ min: 1 }).withMessage("Select at least one interest")
    .custom((arr) => {
      const invalid = arr.filter((i) => !VALID_INTERESTS.includes(i));
      if (invalid.length) throw new Error(`Invalid interests: ${invalid.join(", ")}. Valid: ${VALID_INTERESTS.join(", ")}`);
      return true;
    }),
  body("travelStyle")
    .optional()
    .isIn(VALID_TRAVEL_STYLES).withMessage(`travelStyle must be one of: ${VALID_TRAVEL_STYLES.join(", ")}`),
  body("travelMonth")
    .optional({ nullable: true })
    .isIn(VALID_MONTHS).withMessage(`travelMonth must be a valid month name`),
];

const recommendationsValidator = [
  body("destination")
    .trim().notEmpty().withMessage("Destination is required")
    .isLength({ max: 120 }).withMessage("Destination too long"),
  body("budget")
    .notEmpty().withMessage("Budget is required")
    .isFloat({ min: 1 }).withMessage("Budget must be a positive number"),
  body("duration")
    .notEmpty().withMessage("Duration is required")
    .isInt({ min: 1, max: 30 }).withMessage("Duration must be between 1 and 30 days"),
  body("interests")
    .optional().isArray().withMessage("Interests must be an array"),
  body("travelStyle")
    .optional()
    .isIn(VALID_TRAVEL_STYLES).withMessage(`travelStyle must be one of: ${VALID_TRAVEL_STYLES.join(", ")}`),
];

module.exports = { generateTripValidator, recommendationsValidator, VALID_INTERESTS, VALID_TRAVEL_STYLES };