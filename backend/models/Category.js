const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  // Flat ceiling for this category — admin sets and can change it any time,
  // same way pricing controls work in the current version.
  maxPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
