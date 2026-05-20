const mongoose = require("mongoose");

const scheduleItemSchema = new mongoose.Schema(
  {
    time: { type: String },
    activity: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    duration: { type: String },
    estimatedCost: { type: Number, default: 0 },
    tips: { type: String },
    category: {
      type: String,
      enum: ["sightseeing","food","transport","accommodation","activity","shopping","nightlife","other"],
      default: "activity",
    },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  { place: String, dish: String, estimatedCost: { type: Number, default: 0 } },
  { _id: false }
);

const accommodationSchema = new mongoose.Schema(
  { name: String, area: String, estimatedCost: { type: Number, default: 0 } },
  { _id: false }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    theme: { type: String },
    activities: [{ type: String }],
    schedule: [scheduleItemSchema],
    meals: {
      breakfast: mealSchema,
      lunch: mealSchema,
      dinner: mealSchema,
    },
    accommodation: accommodationSchema,
    dayBudget: { type: Number },
    transportForDay: { type: String },
  },
  { _id: false }
);

const packingCategorySchema = new mongoose.Schema(
  { name: { type: String, required: true }, items: [{ type: String }] },
  { _id: false }
);

const weatherSchema = new mongoose.Schema(
  { temperature: String, condition: String, rainPrediction: String, suggestion: String },
  { _id: false }
);

const budgetBreakdownSchema = new mongoose.Schema(
  {
    accommodation: Number, food: Number, transport: Number,
    activities: Number, shopping: Number, miscellaneous: Number, total: Number,
  },
  { _id: false }
);

const overviewSchema = new mongoose.Schema(
  {
    destination: String, duration: Number, travelStyle: String,
    budgetTier: String, totalBudget: Number,
    currency: { type: String, default: "INR" },
    bestTimeToVisit: String, quickTips: [String],
  },
  { _id: false }
);

const recommendationsSchema = new mongoose.Schema(
  {
    hotels: [mongoose.Schema.Types.Mixed],
    restaurants: [mongoose.Schema.Types.Mixed],
    attractions: [mongoose.Schema.Types.Mixed],
    activities: [mongoose.Schema.Types.Mixed],
    localTransport: mongoose.Schema.Types.Mixed,
    quickFacts: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    destination: { type: String, required: [true, "Destination is required"], trim: true, maxlength: [120, "Destination too long"] },
    budget: { type: Number, required: [true, "Budget is required"], min: [1, "Budget must be positive"] },
    duration: { type: Number, required: [true, "Duration is required"], min: [1, "Min 1 day"], max: [30, "Max 30 days"] },
    interests: { type: [String], default: [] },
    travelStyle: {
      type: String,
      enum: ["budget","mid-range","luxury","adventure","family","solo","couple","group","balanced"],
      default: "balanced",
    },
    overview: overviewSchema,
    itinerary: [itineraryDaySchema],
    packing_list: [packingCategorySchema],
    weather: weatherSchema,
    budgetBreakdown: budgetBreakdownSchema,
    recommendations: recommendationsSchema,
    generationDurationMs: { type: Number },
    aiProvider: { type: String, default: "groq" },
    model: { type: String },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ destination: "text" });

module.exports = mongoose.model("Trip", tripSchema);
