const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['marquee', 'tables_chairs', 'audio', 'sporting', 'cooking', 'other']
  },
  description: {
    type: String,
    default: ''
  },
  images: {
    type: [String], // URLs to uploaded images
    default: []
  },
  // Different equipment types have different specs, so we keep this flexible
  // rather than hardcoding fields like "wattage" or "capacity" for everything
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  hireRate: {
    amount: { type: Number, required: true },
    period: { type: String, enum: ['per_day', 'per_hour', 'per_weekend'], default: 'per_day' }
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  quantityAvailable: {
    type: Number,
    required: true,
    default: 1
  },
  bookingConditions: {
    type: String,
    default: ''
  },
  cancellationPolicy: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true // lets admins hide equipment without deleting it
  }
}, { timestamps: true }); // adds createdAt / updatedAt automatically

module.exports = mongoose.model('Equipment', equipmentSchema);