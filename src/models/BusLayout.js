const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number },
  x: Number,
  y: Number,
  type: { 
    type: String, enum: ["seat", "toilet", "stairs", "empty"] 
  },
});

const layoutSchema = new mongoose.Schema({
  name: { 
    type: String,
     required: true, 
     unique: true 
    },
  floors: { 
    type: Number, 
    enum: [1, 2], 
    required: true 
},
  lowerDeck: [seatSchema],
  upperDeck: [seatSchema], 
}, { timestamps: true });

module.exports = mongoose.model("BusLayout", layoutSchema);