const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    plate: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: {type: String},
    layout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusLayout",
      required: true,
    },
       lowerDeckSeatCount: { type: Number, default: 0 },
    upperDeckSeatCount: { type: Number, default: 0 },
    totalSeatCount:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);