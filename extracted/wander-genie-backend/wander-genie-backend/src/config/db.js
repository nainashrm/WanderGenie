const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    console.warn("⚠️   Continuing without database — API may not function fully");
    return false;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️   MongoDB disconnected");
});

module.exports = connectDB;
