const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    document: { 
      type: String, 
      required: true, 
      trim: true 
    },
    seatNumber: { 
      type: Number 
    }, 
    boarded: { 
      type: Boolean, 
      default: false 
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    date: { 
      type: String, 
      required: true 
    }, 
    time: { 
      type: String, 
      required: true },
    tripStatus: {
      type: String, 
      default: "pending"
    }, 
    routeId: { 
      type: String, 
      required: true 
    },
    bus: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Bus", required: true 
    },
    driver: { 
      type: String, 
      required: true 
    },
    notes: { 
      type: String 
    },

    passengers: { type: [passengerSchema], default: [] },
    totalPassengers: { type: Number, default: 0 },

   
    capacity: { type: Number, default: 0 },

    
    departureAt: { type: Date },
  },
  { timestamps: true }
);


tripSchema.index({ bus: 1, date: 1, time: 1 });

module.exports = mongoose.model("Trip", tripSchema);