const { body } = require("express-validator");
const { INTEREST_OPTIONS } = require("../config/constants");

const generateTripValidator = [
  body("destination")
    .trim()
    .notEmpty().withMessage("Destination is required")
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
      const invalid = arr.filter((i) => !INTEREST_OPTIONS.includes(i));
      if (invalid.length) throw new Error(`Invalid interests: ${invalid.join(", ")}`);
      return true;
    }),
];

module.exports = { generateTripValidator };
