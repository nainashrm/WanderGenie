const mongoose = require("mongoose");

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: [{ type: String }],
  },
  { _id: false }
);

const packingCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [{ type: String }],
  },
  { _id: false }
);

const weatherInfoSchema = new mongoose.Schema(
  {
    temperature: { type: String },
    condition: { type: String },
    rainPrediction: { type: String },
    suggestion: { type: String },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = anonymous/guest trip
    },
    // ── Request (what the user submitted) ──
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [120, "Destination too long"],
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: [1, "Budget must be positive"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
      max: [30, "Duration cannot exceed 30 days"],
    },
    interests: {
      type: [String],
      default: [],
    },
    // ── Response (AI-generated content) ──
    itinerary: [itineraryDaySchema],
    packing_list: [packingCategorySchema],
    weather: weatherInfoSchema,
    // ── Meta ──
    generationDurationMs: { type: Number },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ destination: "text" });

module.exports = mongoose.model("Trip", tripSchema);
