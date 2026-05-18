const express = require("express");
const router = express.Router();
const {
  register, login, refreshToken, logout,
  getMe, updateMe, changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  registerValidator, loginValidator, changePasswordValidator,
} = require("../validators/authValidators");

router.post("/register", validate(registerValidator), register);
router.post("/login", validate(loginValidator), login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/change-password", protect, validate(changePasswordValidator), changePassword);

module.exports = router;
