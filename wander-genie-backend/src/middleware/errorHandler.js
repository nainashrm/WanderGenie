const { error } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return error(res, "Validation failed", 400, errors);
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    return error(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already in use`, 409);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return error(res, "Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return error(res, "Token expired", 401);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  return error(res, message, statusCode);
};

module.exports = errorHandler;
