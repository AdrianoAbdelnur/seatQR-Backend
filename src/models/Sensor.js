const mongoose = require('mongoose');

const SensorSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: String,
  location: {
    lat: Number,
    lng: Number,
  },
  installDate: Date,
  notes: String,

  totalLiters: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Sensor', SensorSchema);