const { verifyAccessToken } = require("../utils/jwt");
const { unauthorized } = require("../utils/response");
const User = require("../models/User");

/**
 * Protect routes — requires a valid Bearer token.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized(res, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select("-password -refreshToken");
    if (!user) return unauthorized(res, "User no longer exists");

    req.user = user;
    next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return unauthorized(res, msg);
  }
};

/**
 * Optional auth — populates req.user if token present, but doesn't block.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("-password -refreshToken");
      if (user) req.user = user;
    }
  } catch (_) {
    // silently ignore invalid token in optional mode
  }
  next();
};

module.exports = { protect, optionalAuth };
