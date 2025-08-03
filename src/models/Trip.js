const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    document: { type: String, required: true, trim: true },
    seatNumber: { type: Number }, 
    boarded: { type: Boolean, default: false },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g. "2025-08-13"
    time: { type: String, required: true }, // e.g. "22:24"
    routeId: { type: String, required: true }, // if you have a Route model later, change to ObjectId
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    driver: { type: String, required: true },
    notes: { type: String },

    passengers: { type: [passengerSchema], default: [] },
    totalPassengers: { type: Number, default: 0 },

    // bus capacity at the moment of creating the trip
    capacity: { type: Number, default: 0 },

    // optional: combined datetime for easier searches
    departureAt: { type: Date },
  },
  { timestamps: true }
);

// Useful index for queries
tripSchema.index({ bus: 1, date: 1, time: 1 });

module.exports = mongoose.model("Trip", tripSchema);