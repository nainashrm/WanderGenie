const Trip = require("../models/Trip");
const User = require("../models/User");
const { generateItinerary } = require("../services/itineraryService");
const { success, created, notFound, forbidden, badRequest } = require("../utils/response");

// POST /api/trips/generate  (or legacy: POST /generate-itinerary)
const generate = async (req, res, next) => {
  try {
    const { destination, budget, duration, interests } = req.body;

    const { itinerary, packing_list, weather, generationDurationMs } =
      await generateItinerary({ destination, budget, duration, interests });

    // Persist the trip (linked to user if logged in, anonymous otherwise)
    const trip = await Trip.create({
      user: req.user?._id || null,
      destination,
      budget,
      duration,
      interests,
      itinerary,
      packing_list,
      weather,
      generationDurationMs,
    });

    return created(res, { trip }, "Itinerary generated");
  } catch (err) {
    next(err);
  }
};

// GET /api/trips  — list current user's trips
const getMyTrips = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      Trip.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v"),
      Trip.countDocuments({ user: req.user._id }),
    ]);

    return success(res, {
      trips,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/:id
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id).select("-__v");
    if (!trip) return notFound(res, "Trip not found");

    // Only the owner (or anonymous trips with no user) can access
    if (trip.user && req.user && trip.user.toString() !== req.user._id.toString()) {
      return forbidden(res, "Access denied");
    }

    return success(res, { trip });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trips/:id/save  — toggle saved state
const saveTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return notFound(res, "Trip not found");
    if (!trip.user || trip.user.toString() !== req.user._id.toString()) {
      return forbidden(res, "Access denied");
    }

    trip.isSaved = !trip.isSaved;
    await trip.save();

    // Keep User.savedTrips in sync
    if (trip.isSaved) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedTrips: trip._id } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedTrips: trip._id } });
    }

    return success(res, { isSaved: trip.isSaved }, 200, trip.isSaved ? "Trip saved" : "Trip unsaved");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:id
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return notFound(res, "Trip not found");
    if (!trip.user || trip.user.toString() !== req.user._id.toString()) {
      return forbidden(res, "Access denied");
    }

    await trip.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedTrips: trip._id } });

    return success(res, {}, 200, "Trip deleted");
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/saved  — list saved trips for current user
const getSavedTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.user._id, isSaved: true })
      .sort({ updatedAt: -1 })
      .select("-__v");
    return success(res, { trips });
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, getMyTrips, getTrip, saveTrip, deleteTrip, getSavedTrips };
