const User = require("../models/User");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { success, created, badRequest, unauthorized, error: serverError } = require("../utils/response");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return badRequest(res, "Email already registered");

    const user = await User.create({ name, email, password });

    const accessToken = signAccessToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return created(res, { user, accessToken, refreshToken }, "Account created successfully");
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) return unauthorized(res, "Invalid email or password");

    const match = await user.comparePassword(password);
    if (!match) return unauthorized(res, "Invalid email or password");

    const accessToken = signAccessToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Strip sensitive fields before sending
    const userObj = user.toJSON();
    return success(res, { user: userObj, accessToken, refreshToken }, 200, "Login successful");
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return badRequest(res, "Refresh token required");

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return unauthorized(res, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      return unauthorized(res, "Refresh token revoked");
    }

    const accessToken = signAccessToken({ id: user._id });
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return success(res, { accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return success(res, {}, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return success(res, { user: req.user });
};

// PATCH /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const allowedFields = ["name", "avatar"];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return success(res, { user }, 200, "Profile updated");
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const match = await user.comparePassword(currentPassword);
    if (!match) return badRequest(res, "Current password is incorrect");

    user.password = newPassword;
    await user.save();

    return success(res, {}, 200, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updateMe, changePassword };
