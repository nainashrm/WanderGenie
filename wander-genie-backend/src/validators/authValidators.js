const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 80 }).withMessage("Name must be under 80 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidator = [
  body("email")
    .trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

module.exports = { registerValidator, loginValidator, changePasswordValidator };
